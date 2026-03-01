<script setup lang="ts">
import * as buttonVariants from './button'

withDefaults(
  defineProps<{
    color?: 'error' | 'theme' | 'primary' | 'edit-plan-table'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    square?: boolean
    disabled?: boolean
    stretch?: 'width' | 'height' | 'both'
    variant?: 'transparent'
    outline?: boolean
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    icon?: string
    testId?: string
    ui?: { button?: string; icon?: string; loader?: string }
  }>(),
  {
    type: 'button',
  }
)

defineEmits<{
  click: [Event]
}>()
</script>

<template>
  <button
    :class="[
      buttonVariants.button({
        color: outline ? color || false : color || 'theme',
        disabled: disabled || loading,
        stretch,
        variant,
        outline,
        square: !!(square || (icon && !$slots.default)),
        size,
        class: ui?.button,
      }),
    ]"
    :disabled="disabled || loading"
    :data-testid="testId ? testId : 'supa-button'"
    :type
    @click="(e) => $emit('click', e)"
  >
    <SupaSpinner v-if="loading" :ui="{ icon: `text-inherit ${ui?.loader}` }" />

    <SupaIcon
      v-if="icon && !loading"
      test-id="button-icon"
      :name="icon"
      mode="svg"
      :ui="{ icon: `text-inherit ${ui?.icon}` }"
    />

    <slot />
  </button>
</template>
