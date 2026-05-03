<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import * as textareaVariants from './textarea'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    placeholder?: string
    disabled?: boolean
    loading?: boolean
    readonly?: boolean
    errorMessage?: string
    highlightError?: boolean
    autoFocus?: boolean
    ui?: { wrapper?: string; editor?: string; label?: string }
  }>(),
  {
    modelValue: '',
  }
)

const emit = defineEmits<{
  'update:modelValue': [string]
  focus: [Event]
  blur: [Event]
}>()

const id = self.crypto.randomUUID()

const isError = computed(() => Boolean(props.errorMessage) || Boolean(props.highlightError))
const isDisabled = computed(() => Boolean(props.disabled || props.loading))
const isReadonly = computed(() => Boolean(props.readonly))
const isInteractive = computed(() => !isReadonly.value && !isDisabled.value)

const editor = useEditor({
  content: props.modelValue,
  editable: isInteractive.value,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    Placeholder.configure({
      placeholder: props.placeholder ?? '',
    }),
  ],
  onUpdate({ editor }) {
    const html = editor.getHTML()
    if (html !== props.modelValue) emit('update:modelValue', html)
  },
  onFocus({ event }) {
    emit('focus', event)
  },
  onBlur({ event }) {
    emit('blur', event)
  },
})

watch(
  () => props.modelValue,
  (val) => {
    const current = editor.value?.getHTML()
    if (val !== current) editor.value?.commands.setContent(val ?? '', { emitUpdate: false })
  }
)

watch(isInteractive, (val) => {
  editor.value?.setEditable(val)
})

onMounted(() => {
  if (props.autoFocus && isInteractive.value) {
    nextTick(() => editor.value?.commands.focus('end'))
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

interface ToolButton {
  name: string
  icon: string
  title: string
  isActive?: () => boolean
  run: () => void
}

const setLink = () => {
  const e = editor.value
  if (!e) return
  const prev = e.getAttributes('link').href
  const url = window.prompt('Enter URL', prev ?? 'https://')
  if (url === null) return
  if (url === '') {
    e.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  e.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const tools = computed<ToolButton[]>(() => {
  const e = editor.value
  if (!e) return []
  return [
    { name: 'bold', icon: 'lucide:bold', title: 'Bold', isActive: () => e.isActive('bold'), run: () => e.chain().focus().toggleBold().run() },
    { name: 'italic', icon: 'lucide:italic', title: 'Italic', isActive: () => e.isActive('italic'), run: () => e.chain().focus().toggleItalic().run() },
    { name: 'strike', icon: 'lucide:strikethrough', title: 'Strikethrough', isActive: () => e.isActive('strike'), run: () => e.chain().focus().toggleStrike().run() },
    { name: 'h2', icon: 'lucide:heading-2', title: 'Heading 2', isActive: () => e.isActive('heading', { level: 2 }), run: () => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { name: 'h3', icon: 'lucide:heading-3', title: 'Heading 3', isActive: () => e.isActive('heading', { level: 3 }), run: () => e.chain().focus().toggleHeading({ level: 3 }).run() },
    { name: 'bullet', icon: 'lucide:list', title: 'Bullet list', isActive: () => e.isActive('bulletList'), run: () => e.chain().focus().toggleBulletList().run() },
    { name: 'ordered', icon: 'lucide:list-ordered', title: 'Ordered list', isActive: () => e.isActive('orderedList'), run: () => e.chain().focus().toggleOrderedList().run() },
    { name: 'quote', icon: 'lucide:quote', title: 'Quote', isActive: () => e.isActive('blockquote'), run: () => e.chain().focus().toggleBlockquote().run() },
    { name: 'code', icon: 'lucide:code-2', title: 'Code block', isActive: () => e.isActive('codeBlock'), run: () => e.chain().focus().toggleCodeBlock().run() },
    { name: 'link', icon: 'lucide:link', title: 'Link', isActive: () => e.isActive('link'), run: setLink },
    { name: 'undo', icon: 'lucide:undo-2', title: 'Undo', run: () => e.chain().focus().undo().run() },
    { name: 'redo', icon: 'lucide:redo-2', title: 'Redo', run: () => e.chain().focus().redo().run() },
  ]
})
</script>

<template>
  <div :class="[textareaVariants.wrapper({ disabled: isDisabled, class: ui?.wrapper })]">
    <label
      v-if="label || $slots.label"
      :for="id"
      :class="textareaVariants.label({ error: isError, disabled: isDisabled })"
    >
      <slot name="label">
        {{ label }} <span v-if="isReadonly" class="ml-1 text-placeholder">(readonly)</span>
      </slot>
    </label>

    <div
      :class="[
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border bg-transparent transition-shadow focus-within:ring-1',
        isError
          ? 'border-error focus-within:ring-error'
          : 'border-border focus-within:ring-border-focus',
        isReadonly && 'opacity-50',
        ui?.editor,
      ]"
    >
      <div
        v-if="!isReadonly"
        class="flex flex-none flex-wrap items-center gap-0.5 border-b border-border bg-background/40 p-1"
      >
        <button
          v-for="tool in tools"
          :key="tool.name"
          type="button"
          :title="tool.title"
          :disabled="isDisabled"
          :class="[
            'inline-flex h-7 w-7 items-center justify-center rounded text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
            tool.isActive?.() && 'bg-accent',
          ]"
          @mousedown.prevent
          @click="tool.run"
        >
          <SupaIcon :name="tool.icon" size="xs" />
        </button>
      </div>

      <EditorContent
        :id
        :editor="editor"
        class="rich-editor scrollbar-thin scrollbar-muted min-h-0 flex-1 overflow-y-auto px-3 py-2 text-sm text-foreground"
      />
    </div>

    <p v-if="errorMessage" :class="textareaVariants.errorMessage()">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.rich-editor :deep(.ProseMirror) {
  min-height: 100%;
  outline: none;
}
.rich-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--color-placeholder);
  float: left;
  pointer-events: none;
  height: 0;
}
.rich-editor :deep(h2) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0.6rem 0 0.25rem;
}
.rich-editor :deep(h3) {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.5rem 0 0.25rem;
}
.rich-editor :deep(p) {
  margin: 0.25rem 0;
  line-height: 1.5;
}
.rich-editor :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0.25rem 0;
}
.rich-editor :deep(ol) {
  list-style: decimal;
  padding-left: 1.25rem;
  margin: 0.25rem 0;
}
.rich-editor :deep(li > p) {
  margin: 0;
}
.rich-editor :deep(code) {
  background: rgb(0 0 0 / 0.06);
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.rich-editor :deep(pre) {
  background: rgb(0 0 0 / 0.06);
  padding: 0.6rem 0.8rem;
  border-radius: 0.375rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
}
.rich-editor :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: inherit;
}
.rich-editor :deep(blockquote) {
  border-left: 3px solid var(--color-border);
  padding-left: 0.75rem;
  margin: 0.4rem 0;
  color: var(--color-placeholder);
}
.rich-editor :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.rich-editor :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0.75rem 0;
}
</style>
