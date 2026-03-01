<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: 'text' | 'password'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    placeholder?: string
    label?: string
    disabled?: boolean
    loading?: boolean
    errorMessage?: string
    highlightError?: boolean
    leadingIcon?: string
    readonly?: boolean
    modelValue?: string | number
    autoFocus?: boolean
    testId?: string
    labelTestId?: string
    noShadow?: boolean
    autoFit?: boolean
    cursorAtEnd?: boolean
    ui?: { wrapper?: string; input?: string; label?: string; leadingIcon?: string }
  }>(),
  {
    type: 'text',
  }
)

const emit = defineEmits<{
  focus: [Event]
  blur: [Event]
  click: [Event]
  'update:modelValue': [string]
}>()

const isFirstFocus = ref(true)
const isFocused = ref(false)

const inputFieldRef = useTemplateRef('inputFieldRef')

const moveCaret = async (event: MouseEvent) => {
  if (!props.cursorAtEnd) return
  if (!inputFieldRef.value?.inputFieldRef?.value) return
  if (!isFirstFocus.value) return

  event.preventDefault()

  const len = inputFieldRef.value?.inputFieldRef?.value.length || 0
  inputFieldRef.value?.inputFieldRef?.setSelectionRange(len, len)

  isFirstFocus.value = false
}

const handleFocus = (event: Event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: Event) => {
  isFocused.value = false
  if (props.cursorAtEnd) {
    isFirstFocus.value = true
  }

  emit('blur', event)
}
</script>

<template>
  <SupaInput
    v-bind="props"
    :placeholder="isFocused ? '' : placeholder"
    ref="inputFieldRef"
    @click="emit('click', $event)"
    @mouseup="moveCaret"
    @focus="handleFocus"
    @blur="handleBlur"
    @update:model-value="(v: string) => $emit('update:modelValue', v)"
  >
    <template #leading>
      <slot name="leading" />
    </template>
    <template #trailing>
      <slot name="trailing" />
    </template>
  </SupaInput>
</template>
