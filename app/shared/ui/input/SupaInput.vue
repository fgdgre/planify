<script setup lang="ts">
import * as inputVariants from './input'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    type?: 'text' | 'password'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    placeholder?: string
    label?: string
    disabled?: boolean
    loading?: boolean
    errorMessage?: string
    highlightError?: boolean
    leadingIcon?: string
    readonly?: boolean
    modelValue?: string | number
    autoFocus?: boolean
    testId?: string
    labelTestId?: string
    noShadow?: boolean
    autoFit?: boolean
    ui?: { wrapper?: string; input?: string; label?: string; leadingIcon?: string }
  }>(),
  {
    type: 'text',
  }
)

const emit = defineEmits<{
  focus: [Event]
  blur: [Event]
  click: [Event]
  'update:modelValue': [string]
}>()

const inputFieldRef = useTemplateRef('inputFieldRef')

defineExpose({
  inputFieldRef,
})

const { modelModifiers } = useAttrs() as {
  modelModifiers?: {
    trim?: boolean
    number?: boolean
    uppercase?: boolean
    lowercase?: boolean
    capitalize?: boolean
    commaToDot?: boolean
  }
}

onMounted(() => {
  if (inputFieldRef.value && props.autoFocus) {
    inputFieldRef.value.focus()
  }
})

const updateModelValue = (value: string) => {
  if (modelModifiers?.uppercase) {
    return emit('update:modelValue', value.toUpperCase())
  }
  if (modelModifiers?.lowercase) {
    return emit('update:modelValue', value.toLocaleLowerCase())
  }
  if (modelModifiers?.capitalize) {
    return emit('update:modelValue', value.charAt(0).toUpperCase() + value.slice(1))
  }
  if (modelModifiers?.commaToDot) {
    return emit('update:modelValue', value.replace(',', '.'))
  }
  return emit('update:modelValue', value)
}

const id = self.crypto.randomUUID()

const padding = ({ trailing, leading }: { trailing: boolean; leading: boolean }) => {
  if (trailing && leading) return 'both'

  if (trailing) return 'trailing'

  if (leading) return 'leading'
}
</script>

<template>
  <div
    :class="[inputVariants.wrapper({ disabled: disabled || loading, class: ui?.wrapper })]"
    data-testid="input-wrapper"
  >
    <div v-if="label || $slots.label" class="flex w-full items-center h-min">
      <label
        v-if="label"
        :data-testid="labelTestId || 'input-label'"
        :for="id"
        :class="[
          inputVariants.label({
            disabled: disabled || loading,
            error: errorMessage || highlightError ? true : false,
            class: ui?.label,
          }),
        ]"
      >
        {{ label }} <span v-if="Boolean(readonly)" class="ml-1 text-placeholder">(readonly)</span>
      </label>

      <slot name="label" />
    </div>

    <div class="relative">
      <div v-if="leadingIcon || $slots.leading" :class="[inputVariants.absoluteWrappper({ position: 'left' })]">
        <slot name="leading">
          <SupaIcon
            :name="leadingIcon"
            :ui="{
              icon: inputVariants.icon({
                error: errorMessage || highlightError ? true : false,
                class: ui?.leadingIcon,
              }),
            }"
            :data-attribute="leadingIcon"
            mode="svg"
            test-id="input-leading-icon"
          />
        </slot>
      </div>
      <input
        :size="autoFit ? 1 : 20"
        :id
        :aria-invalid="Boolean(errorMessage) || highlightError"
        :aria-describedby="errorMessage"
        v-bind="$attrs"
        ref="inputFieldRef"
        :data-testid="testId || 'input-field'"
        :readonly="readonly"
        class="placeholder-input"
        :class="[
          inputVariants.inputField({
            disabled: disabled || loading,
            error: errorMessage || highlightError ? true : false,
            readonly: readonly,
            padding: padding({
              leading: Boolean(leadingIcon) || Boolean($slots.leading),
              trailing: Boolean($slots.trailing),
            }),
            noShadow,
            size,
            class: ui?.input,
          }),
        ]"
        :type
        :placeholder
        :value="modelValue"
        :disabled="disabled || loading"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
        @input="updateModelValue(($event.target as HTMLInputElement).value)"
      />

      <div
        v-if="$slots.trailing"
        data-testid="input-trailing-slot"
        :class="[inputVariants.absoluteWrappper({ position: 'right' })]"
      >
        <slot name="trailing" />
      </div>
    </div>

    <div v-if="errorMessage || $slots.errorMessage" data-testid="input-error-message">
      <slot name="errorMessage">
        <p v-if="errorMessage" :class="inputVariants.errorMessage()">
          {{ errorMessage }}
        </p>
      </slot>
    </div>
  </div>
</template>

<style>
.placeholder-input::placeholder {
  color: var(--placeholder);
}
</style>
