<script setup lang="ts">
import { useNotification } from '~/notification'

const { toasts, removeToast } = useNotification()
</script>

<template>
  <NuxtPage />

  <SupaToastsGroup :toasts @close-toast="(id: string) => removeToast(id)" />
</template>
