<script setup lang="ts">
const isOpen = defineModel<boolean>()

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    expanded?: boolean
    loading?: boolean
    loadingText?: string
    showFooter?: boolean
    submitLabel?: string
    cancelLabel?: string
    saving?: boolean
    preventClose?: boolean
    compactWrapperClass?: string
    expandedWrapperClass?: string
    mainClass?: string
    contextClass?: string
    compactClass?: string
    /** Fixed width of the right context column when expanded. Defaults to 350px. */
    contextWidth?: string
  }>(),
  {
    loadingText: 'Loading...',
    submitLabel: 'Save',
    cancelLabel: 'Cancel',
    compactWrapperClass: 'w-[520px] max-w-[calc(100vw-48px)]',
    expandedWrapperClass: 'w-[80vw] max-w-[80vw]',
    mainClass: '',
    contextClass: '',
    compactClass: '',
    contextWidth: '350px',
  }
)

defineEmits<{
  submit: []
  cancel: []
}>()
</script>

<template>
  <SupaSidebar
    v-model="isOpen"
    position="right"
    theme="white"
    with-close-button
    no-padding
    :prevent-close="preventClose"
    :ui="{
      wrapper: expanded ? expandedWrapperClass : compactWrapperClass,
      mainContent: 'w-full p-0',
      title: 'border-b border-border h-12',
      footer: 'h-min flex-0',
    }"
  >
    <template #title>
      <slot name="title">
        <div class="flex min-w-0 flex-col">
          <p v-if="title" class="truncate text-sm font-medium text-foreground">
            {{ title }}
          </p>
          <p v-if="subtitle" class="truncate text-xs text-placeholder">
            {{ subtitle }}
          </p>
        </div>
      </slot>
    </template>

    <template #content>
      <div v-if="loading" class="flex h-full items-center justify-center text-sm text-placeholder">
        {{ loadingText }}
      </div>

      <div
        v-else
        class="h-full overflow-hidden"
        :class="expanded ? 'grid' : 'flex flex-col'"
        :style="expanded ? { gridTemplateColumns: `minmax(0, 1fr) ${contextWidth}` } : {}"
      >
        <section
          v-if="expanded"
          class="flex min-w-0 flex-col gap-4 overflow-hidden border-r border-border p-6"
          :class="mainClass"
        >
          <slot name="main" />
        </section>

        <section
          class="flex min-w-0 flex-col overflow-y-auto"
          :class="expanded ? ['bg-placeholder/5 p-4', contextClass] : ['flex-1 p-6', compactClass]"
        >
          <slot name="context" />
        </section>
      </div>
    </template>

    <template v-if="showFooter || $slots.footer" #footer>
      <slot name="footer">
        <div class="flex w-full justify-end gap-2">
          <SupaButton color="primary" :loading="saving" @click="$emit('submit')">
            {{ submitLabel }}
          </SupaButton>
          <SupaButton variant="transparent" @click="$emit('cancel')">
            {{ cancelLabel }}
          </SupaButton>
        </div>
      </slot>
    </template>
  </SupaSidebar>
</template>
