<script setup lang="ts">
import * as sidebarStyles from './sidebar'

const isOpen = defineModel<boolean>()

withDefaults(
  defineProps<{
    overlay?: boolean
    withCloseButton?: boolean
    testId?: string
    position?: 'left' | 'right'
    preventClose?: boolean
    toggleFixedButton?: boolean
    noPadding?: boolean
    ui?: {
      title?: string
      mainContent?: string
      footer?: string
      closeButton?: string
      wrapper?: string
    }
  }>(),
  {
    position: 'left',
    overlay: true,
  }
)

defineEmits<{
  'update:modelValue': [boolean]
}>()

watchEffect(() => {
  if (isOpen.value) {
    document.querySelector('html')?.classList.add('overflow-hidden')
  } else {
    document.querySelector('html')?.classList.remove('overflow-hidden')
  }
})
</script>

<template>
  <div
    v-if="overlay && isOpen"
    :class="[sidebarStyles.overlay()]"
    :data-testid="testId ? testId + '-overlay' : 'sidebar-overlay'"
    @click="preventClose ? '' : (isOpen = false)"
  />

  <aside
    ref="sidebar"
    :class="[sidebarStyles.wrapper({ open: isOpen, position, class: ['transition-sidebar', ui?.wrapper] })]"
    :data-testid="testId || 'supa-sidebar'"
  >
    <div
      v-if="$slots.title || withCloseButton"
      :class="[sidebarStyles.title({ class: ui?.title })]"
      :data-testid="testId ? testId + '-title-wrapper' : 'sidebar-title-wrapper'"
    >
      <div
        v-if="$slots.title"
        class="flex items-center w-full"
        :data-testid="testId ? testId + '-title' : 'sidebar-title'"
      >
        <slot name="title" />
      </div>

      <SupaButton
        v-if="withCloseButton"
        :data-testid="testId ? testId + '-close-button' : 'sidebar-close-button'"
        icon="heroicons:x-mark"
        :ui="{ icon: `text-sidebar-foreground size-5 ${ui?.closeButton}` }"
        variant="transparent"
        @click="isOpen = false"
      />
    </div>

    <div
      v-if="$slots.content"
      :data-testid="testId ? testId + '-main-content-wrapper' : 'sidebar-main-content-wrapper'"
      :class="[sidebarStyles.mainContent({ noPadding, class: ui?.mainContent })]"
    >
      <slot name="content" />
    </div>

    <div
      v-if="$slots.footer"
      :data-testid="testId ? testId + '-footer-wrapper' : 'sidebar-footer-wrapper'"
      :class="[sidebarStyles.footerWrapper({ self: $slots.content ? false : true })]"
    >
      <div :class="[sidebarStyles.footer({ class: ui?.footer })]">
        <slot name="footer" />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.transition-sidebar {
  transition: all 0.25s ease;
}
</style>
