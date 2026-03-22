<script setup lang="ts">
import * as modalVariants from './modal'

const props = defineProps<{
  title?: string
  fullscreen?: boolean
  icon?: string
  noWrap?: boolean
  showCloseButton?: boolean
  preventClose?: boolean
  scrollableContent?: boolean
  ui?: {
    wrapper?: string
    icon?: string
    titleWrapper?: string
    mainContent?: string
    actions?: string
    closeButton?: string
    backdrop?: string
  }
}>()

defineEmits<{
  close: []
}>()

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = 'visible'
})
</script>

<template>
  <Teleport to="body">
    <div :class="[modalVariants.backdrop({ class: ui?.backdrop })]" test-id="supa-modal-backdrop" @click="$emit('close')" />

    <div
      ref="target"
      v-bind="$attrs"
      :class="[
        modalVariants.wrapper({ fullscreen, class: ui?.wrapper }),
      ]"
    >
      <SupaButton
        v-if="showCloseButton"
        icon="heroicons:x-mark"
        test-id="supa-modal-close-button"
        variant="transparent"
        :ui="{ button: `absolute top-[8px] right-[8px] ${ui?.closeButton}` }"
        @click="$emit('close')"
      />

      <div
        v-if="props.title || $slots.title"
        data-testid="supa-modal-header"
        :class="[modalVariants.wrapperTitle({ class: ui?.titleWrapper })]"
      >
        <slot name="title">
          <p>{{ title }}</p>
        </slot>
      </div>

      <div
        :class="[
          modalVariants.mainContent({
            scrollable: scrollableContent,
            smallModal: !fullscreen,
            fullscreen: fullscreen,
          }),
        ]"
        data-testid="supa-modal-main-content"
      >
        <slot />
      </div>

      <div
        v-if="$slots.actions"
        data-testid="supa-modal-footer"
        :class="[modalVariants.footer({ class: ui?.actions })]"
      >
        <slot name="actions" />
      </div>
    </div>
  </Teleport>
</template>
