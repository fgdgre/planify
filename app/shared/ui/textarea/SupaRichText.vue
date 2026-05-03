<script setup lang="ts">
import DOMPurify from 'dompurify'

const props = withDefaults(
  defineProps<{
    content?: string | null
    lineClamp?: 1 | 2 | 3 | 4 | 5 | 6
    size?: 'xs' | 'sm' | 'md'
    class?: any
  }>(),
  {
    size: 'sm',
  }
)

const ALLOWED_TAGS = [
  'p', 'br', 'span',
  'strong', 'b', 'em', 'i', 'u', 's', 'del',
  'a', 'ul', 'ol', 'li',
  'h2', 'h3',
  'code', 'pre',
  'blockquote', 'hr',
]
const ALLOWED_ATTR = ['href', 'target', 'rel']

const safe = computed(() => {
  if (!props.content) return ''
  return DOMPurify.sanitize(props.content, { ALLOWED_TAGS, ALLOWED_ATTR })
})

const clampClass = computed(() => {
  switch (props.lineClamp) {
    case 1: return 'line-clamp-1'
    case 2: return 'line-clamp-2'
    case 3: return 'line-clamp-3'
    case 4: return 'line-clamp-4'
    case 5: return 'line-clamp-5'
    case 6: return 'line-clamp-6'
    default: return ''
  }
})
</script>

<template>
  <div
    v-if="safe"
    :class="['rich-text', `rich-text--${size}`, clampClass, props.class]"
    v-html="safe"
  />
</template>

<style scoped>
.rich-text :deep(> *) {
  margin: 0;
}
.rich-text :deep(> * + *) {
  margin-top: 0.25rem;
}
.rich-text :deep(h2),
.rich-text :deep(h3) {
  font-weight: 600;
  color: var(--color-foreground);
}
.rich-text--xs :deep(h2),
.rich-text--xs :deep(h3) {
  font-size: 0.8125rem;
  line-height: 1.1rem;
}
.rich-text--sm :deep(h2),
.rich-text--sm :deep(h3) {
  font-size: 0.875rem;
  line-height: 1.2rem;
}
.rich-text--md :deep(h2) {
  font-size: 1.125rem;
  line-height: 1.5rem;
}
.rich-text--md :deep(h3) {
  font-size: 1rem;
  line-height: 1.4rem;
}
.rich-text :deep(ul) {
  list-style: disc;
  padding-left: 1.1rem;
}
.rich-text :deep(ol) {
  list-style: decimal;
  padding-left: 1.1rem;
}
.rich-text :deep(li) {
  margin: 0;
}
.rich-text :deep(li > p) {
  margin: 0;
}
.rich-text :deep(code) {
  background: rgb(0 0 0 / 0.06);
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.rich-text :deep(pre) {
  background: rgb(0 0 0 / 0.06);
  padding: 0.4rem 0.6rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
}
.rich-text :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: inherit;
}
.rich-text :deep(blockquote) {
  border-left: 2px solid var(--color-border);
  padding-left: 0.5rem;
  color: var(--color-placeholder);
}
.rich-text :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.rich-text :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0.5rem 0;
}
.rich-text--xs {
  font-size: 0.75rem;
  line-height: 1rem;
}
.rich-text--sm {
  font-size: 0.8125rem;
  line-height: 1.15rem;
}
.rich-text--md {
  font-size: 0.875rem;
  line-height: 1.3rem;
}
</style>
