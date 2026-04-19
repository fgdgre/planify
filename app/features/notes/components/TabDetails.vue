<script setup lang="ts">
const title = defineModel<string>('title', { required: true })
const content = defineModel<string>('content', { required: true })
</script>

<template>
  <div
    class="flex flex-col gap-4 px-4 pb-4"
  >
    <SupaInput
      v-model="title"
      label="Title"
      placeholder="Note title"
    />

    <SupaTextarea
      v-model="content"
      class="min-h-[320px]"
      label="Content"
      placeholder="Write your note..."
    />
  </div>
</template>
