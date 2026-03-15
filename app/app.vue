<script setup lang="ts">
import { useNotification } from '@features/notification'
import { useInitApp } from "@features/auth";

const { toasts, removeToast } = useNotification()

const { isInitializing } = useInitApp()
</script>

<template>
  <div v-if="isInitializing">
    init...
  </div>

  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>

  <SupaToastsGroup :toasts @close-toast="(id: string) => removeToast(id)" />
</template>
