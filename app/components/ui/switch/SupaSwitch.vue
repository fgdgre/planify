<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import * as switchVariants from './switch'

const model = defineModel<boolean>()

withDefaults(
  defineProps<{
    label?: string
    color?: 'primary' | 'error' | 'default'
    disabled?: boolean
    icon?: string
  }>(),
  {
    color: 'default',
  }
)
</script>

<template>
  <label :class="[switchVariants.wrapper({ disabled })]">
    <SwitchRoot
      id="airplane-mode"
      v-model:checked="model"
      :class="switchVariants.switchElement({ disabled, color })"
      :disabled
    >
      <SwitchThumb :class="[switchVariants.thumb()]">
        <SupaIcon v-if="icon" :name="icon" :ui="{ icon: 'size-3' }" />
      </SwitchThumb>
    </SwitchRoot>

    <span v-if="label" :class="[switchVariants.label({ disabled })]">{{ label }}</span>
  </label>
</template>
