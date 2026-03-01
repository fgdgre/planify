<script setup lang="ts">
import * as radioStyles from './radio'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    value: string
    modelValue?: string
    label?: string
    disabled?: boolean
    color?: 'primary' | 'error'
    isError?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    modelValue: undefined,
  }
)

const emit = defineEmits<{
  'update:modelValue': [string]
  blur: [Event]
}>()

const updateModelValue = () => {
  emit('update:modelValue', props.value)
}

const id = self.crypto.randomUUID()
</script>

<template>
  <div :class="radioStyles.wrapper({ disabled })">
    <div class="relative w-fit h-min">
      <input
        v-bind="$attrs"
        :id
        type="radio"
        data-testid="supa-radio"
        :checked="modelValue === value"
        :disabled
        :value
        :class="[radioStyles.radio({ checked: modelValue === value, color, disabled, isError, size })]"
        @change="updateModelValue"
        @blur="(e) => $emit('blur', e)"
      />

      <SupaIcon
        v-show="modelValue === value"
        wrapper-test-id="supa-radio-icon-wrapper"
        test-id="supa-radio-icon"
        name="radix-icons:dot-filled"
        :ui="{ icon: radioStyles.icon({ color, size }) }"
      />
    </div>

    <label v-if="label" :for="id" data-testid="supa-radio-label" :class="[radioStyles.label({ disabled, isError })]">
      {{ label }}
    </label>
  </div>
</template>
