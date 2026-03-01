<script setup lang="ts">
import { errorMessage } from '~/components/ui/input/input'

withDefaults(
  defineProps<{
    checkboxGroup: { name: string; id: string }[]
    modelValue: string[]
    orientation?: 'horizontal' | 'vertical'
    errorMessage?: string
  }>(),
  {
    orientation: 'vertical',
  }
)

const checked = defineModel<string[]>({ default: [] })

const updateChecked = ({ value, id }: { value: boolean; id: string }) => {
  if (!value) {
    checked.value = checked.value.filter((el) => el !== id)
  } else {
    checked.value.push(id)
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-3 w-fit" :class="orientation === 'horizontal' ? 'flex-row' : 'flex-col'">
      <SupaCheckbox
        v-for="checkbox in checkboxGroup"
        :model-value="checked.includes(checkbox.id)"
        :label="checkbox.name"
        :is-error="Boolean(errorMessage)"
        @update:model-value="(e: boolean) => updateChecked({ value: e, id: checkbox.id })"
      />
    </div>

    <p v-if="errorMessage" :class="errorMessage">
      {{ errorMessage }}
    </p>
  </div>
</template>
