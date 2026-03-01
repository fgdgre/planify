<script setup lang="ts">
import { useNotification } from '~/notification'
import { useInitApp } from "~/auth/composables/init";

const { toasts, removeToast } = useNotification()

const { isInitializing } = useInitApp()
</script>

<template>
  <div v-if="isInitializing">
    init...
  </div>
  <NuxtPage v-else />

  <SupaToastsGroup :toasts @close-toast="(id: string) => removeToast(id)" />
</template>
