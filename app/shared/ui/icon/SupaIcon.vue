<script setup lang="ts">
import * as iconVariants from './icon'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    class?: any
    wrapperTestId?: string
    testId?: string
    ui?: { icon?: string }
  }>(),
  {
    size: 'md',
  }
)

const iconWrapperRef = useTemplateRef('icon-wrapper')

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'size-4'
    case 'sm':
      return 'size-5'
    case 'md':
      return 'size-6'
    case 'lg':
      return 'size-7'
    case 'xl':
      return 'size-8'
    default:
      return 'size-6'
  }
})

const addExpectedStyles = (el: Element) => {
  el.classList.add(sizeClass.value, 'stroke-foreground')
  if (props.ui?.icon) {
    el.classList.add(...props.ui.icon.trim().split(/\s+/))
  }
}

onMounted(() => {
  if (iconWrapperRef.value && !props.name) {
    const childEl = iconWrapperRef.value.firstElementChild
    if (childEl) {
      addExpectedStyles(childEl)
      if (props.testId) {
        childEl.setAttribute('data-testid', props.testId)
      }
    }
  }
})
</script>

<template>
  <div v-if="name || $slots.default" ref="icon-wrapper" :data-testid="wrapperTestId" class="contents">
    <slot>
      <Icon
        v-if="name"
        :name
        mode="svg"
        :class="[iconVariants.icon({ size, class: ui?.icon })]"
        :data-testid="testId"
        v-bind="$attrs"
      />
    </slot>
  </div>
</template>
