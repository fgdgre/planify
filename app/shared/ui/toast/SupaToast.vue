<script setup lang="ts">
import { useTimestamp } from '@vueuse/core'
import * as toastVariants from './toast'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
    color?: 'primary' | 'error' | 'primary-light' | 'success' | 'info'
    closable?: boolean
    duration?: number
    showProgress?: boolean
    date?: string
    author?: string
    email?: string
  }>(),
  {
    closable: true,
  }
)

const hasMeta = computed(() => Boolean(props.date || props.author || props.email))

const emit = defineEmits<{
  close: []
}>()

const currentTimestamp = useTimestamp()
const startTime = currentTimestamp.value

if (props.duration) {
  setTimeout(() => {
    emit('close')
  }, props.duration)
}

const width = computed(() => {
  const elapsed = currentTimestamp.value - startTime
  const progress = Math.max(0, 1 - elapsed / (props.duration! - 100))
  return progress * 100
})
</script>

<template>
  <div :class="[toastVariants.wrapper({ withIcon: Boolean(icon), color })]">
    <SupaIcon v-if="icon" :name="icon" :ui="{ icon: toastVariants.iconColor({ color }) }" size="sm" mode="svg" />

    <h5 :class="[toastVariants.toastHeader({ color })]">
      {{ title }}
    </h5>

    <SupaButton
      v-if="closable"
      icon="heroicons:x-mark"
      variant="transparent"
      :ui="{ button: 'p-[2px] w-fit h-fit', icon: `size-5 ${toastVariants.toastHeader({ color })}` }"
      @click="$emit('close')"
    />

    <p v-if="description" :class="[toastVariants.toastParagraph({ withIcon: Boolean(icon), color })]">
      {{ description }}
    </p>

    <div v-if="hasMeta" :class="[toastVariants.toastMeta({ withIcon: Boolean(icon), color })]">
      <span v-if="author" class="font-medium">{{ author }}</span>
      <span v-if="email">{{ email }}</span>
      <span v-if="date" class="ml-auto">{{ date }}</span>
    </div>
    <SupaProgress
      v-if="duration && showProgress"
      :width
      :color="color === 'error' ? 'default' : color"
      :ui="{ wrapper: 'absolute bottom-0' }"
    />
  </div>
</template>

<style>
.toast-message-layout {
  display: grid;
  grid-template-columns: 1fr auto;
}
.icon-toast-message-layout {
  display: grid;
  grid-template-columns: auto 1fr auto;
}
</style>
