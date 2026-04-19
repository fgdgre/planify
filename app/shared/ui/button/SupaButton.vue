<script setup lang="ts">
import { button } from './button'

withDefaults(
  defineProps<{
    color?: 'error' | 'theme' | 'primary'
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
    rounded?: 'full' | 'default'
    ui?: { button?: string; icon?: string; loader?: string }
  }>(),
  {
    type: 'button',
    color: 'primary',
    rounded: 'default',
  }
)

defineEmits<{
  click: [Event]
}>()
</script>

<template>
  <button
    :class="[
      button({
        color: outline ? color || false : color,
        disabled: disabled || loading,
        stretch,
        variant,
        outline,
        square: !!(square || (icon && !$slots.default)),
        size,
        rounded,
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
