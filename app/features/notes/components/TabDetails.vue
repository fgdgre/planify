<script setup lang="ts">
const title = defineModel<string>('title', { required: true })
const content = defineModel<string>('content', { required: true })

withDefaults(
  defineProps<{
    titleError?: string
  }>(),
  {
    titleError: '',
  }
)
</script>

<template>
  <div
    class="flex min-h-0 flex-col gap-4 px-4 pb-4"
  >
    <SupaInput
      v-model="title"
      label="Title"
      placeholder="Note title"
      :error-message="titleError"
      :highlight-error="!!titleError"
    />

    <SupaTextarea
      v-model="content"
      label="Content"
      placeholder="Write your note..."
      resizable
      :ui="{ wrapper: 'flex-1 min-h-0', textarea: 'h-full min-h-[320px]' }"
    />
  </div>
</template>
