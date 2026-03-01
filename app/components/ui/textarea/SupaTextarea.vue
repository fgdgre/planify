<script setup lang="ts">
import * as textareaVariants from './textarea'

const props = defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  placeholder?: string
  label?: string
  disabled?: boolean
  loading?: boolean
  errorMessage?: string
  highlightError?: boolean
  readonly?: boolean
  modelValue?: string | number
  autoFocus?: boolean
  noShadow?: boolean
  resizable?: boolean
  ui?: { wrapper?: string; textarea?: string; label?: string }
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
  focus: [Event]
  blur: [Event]
  click: [Event]
}>()

const textareaFieldRef = useTemplateRef('textareaFieldRef')

onMounted(() => {
  if (textareaFieldRef.value && props.autoFocus) {
    textareaFieldRef.value.focus()
  }
})

const updateModelValue = (value: string) => {
  emit('update:modelValue', value)
}

const id = self.crypto.randomUUID()
</script>

<template>
  <div
    :class="[textareaVariants.wrapper({ disabled: disabled || loading, class: ui?.wrapper })]"
    data-testid="input-wrapper"
  >
    <label
      v-if="label || $slots.label"
      :for="id"
      :class="textareaVariants.label({ error: Boolean(errorMessage) || highlightError, disabled: disabled || loading })"
    >
      <slot name="label">
        {{ label }} <span v-if="Boolean(readonly)" class="ml-1 text-placeholder">(readonly)</span>
      </slot>
    </label>
    <textarea
      :id
      ref="textareaFieldRef"
      v-bind="$attrs"
      :readonly="readonly"
      :class="[
        textareaVariants.textareaField({
          disabled: disabled || loading,
          error: errorMessage || highlightError ? true : false,
          readonly,
          size,
          noShadow,
          resizable,
          class: ui?.textarea,
        }),
      ]"
      :placeholder
      :value="modelValue"
      :disabled="disabled || loading"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
      @input="updateModelValue(($event.target as HTMLInputElement).value)"
      @click="(e) => $emit('click', e)"
    ></textarea>
    <div v-if="errorMessage || $slots.errorMessage">
      <slot name="errorMessage">
        <p v-if="errorMessage" data-testid="input-error-message" :class="textareaVariants.errorMessage()">
          {{ errorMessage }}
        </p>
      </slot>
    </div>
  </div>
</template>
