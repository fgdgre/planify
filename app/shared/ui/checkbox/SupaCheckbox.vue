<script setup lang="ts">
import * as checkboxVariants from './checkbox'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    label?: string
    indeterminate?: boolean
    disabled?: boolean
    isError?: boolean
    icon?: string
    testId?: string
    size?: 'sm' | 'md' | 'lg'
    color?: 'primary' | 'error'
    ui?: { wrapper?: string; label?: string; checkbox?: string }
  }>(),
  {
    modelValue: undefined,
    size: 'md',
  }
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const onChange = (event: Event) => {
  const newValue = (event.target as HTMLInputElement).checked
  emit('update:modelValue', newValue)
}

const id = self.crypto.randomUUID()

const checkboxIcon = computed(() => {
  if (props.indeterminate) {
    return 'radix-icons:minus'
  }
  if (props.icon) {
    return props.icon
  }
  return 'radix-icons:check'
})
</script>

<template>
  <div :class="checkboxVariants.wrapper({ disabled, class: ui?.wrapper })">
    <div class="relative w-fit h-min">
      <input
        v-bind="$attrs"
        :id
        type="checkbox"
        :data-testid="testId ? testId : 'supa-checkbox'"
        :checked="modelValue"
        :disabled
        :indeterminate
        :class="[
          checkboxVariants.checkbox({ checked: modelValue, color, disabled, isError, size, class: ui?.checkbox }),
        ]"
        @change="onChange"
      />

      <Icon
        v-show="modelValue"
        data-testid="supa-checkbox-icon"
        :data-attribute="icon"
        :name="checkboxIcon"
        mode="svg"
        class="size-3"
        :class="[checkboxVariants.icon({ color, size })]"
      />
    </div>

    <label
      v-if="label"
      :for="id"
      data-testid="supa-checkbox-label"
      :class="[checkboxVariants.label({ disabled, isError, class: ui?.label })]"
    >
      {{ label }}
    </label>
  </div>
</template>
