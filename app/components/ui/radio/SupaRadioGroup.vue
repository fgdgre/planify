<script setup lang="ts">
import { label as inputLabel } from '~/components/ui/input/input'

withDefaults(
  defineProps<{
    label?: string
    radioGroup: { id: string; name: string }[]
    size?: 'sm' | 'md' | 'lg'
    modelValue?: string
    orientation?: 'horizontal' | 'vertical'
    errorMessage?: string
  }>(),
  {
    orientation: 'vertical',
  }
)

const emit = defineEmits<{
  'update:modelValue': [string]
  blur: [Event]
}>()

const updateModelValue = (value: string) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="flex flex-col">
    <p v-if="label" :class="[inputLabel({ error: Boolean(errorMessage), class: 'mb-3' })]">{{ label }}</p>
    <div class="flex gap-2 w-fit" :class="[orientation === 'horizontal' ? 'flex-row' : 'flex-col']">
      <SupaRadio
        v-for="radio in radioGroup"
        :model-value
        :value="radio.id"
        :label="radio.name"
        :is-error="Boolean(errorMessage)"
        :size
        @update:model-value="updateModelValue"
        @blur="(e) => $emit('blur', e)"
      />
    </div>
    <p v-if="errorMessage" class="text-error font-medium text-[14px] mt-3">
      {{ errorMessage }}
    </p>
  </div>
</template>
