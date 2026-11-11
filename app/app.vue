<script setup lang="ts">
import { useToast } from '@shared/lib/toast'
import { useInitApp } from "@features/auth";

const { toasts, removeToast } = useToast()

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
