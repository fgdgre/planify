<script setup lang="ts">
import { useLogout, useUserStore } from "@features/auth";

definePageMeta({
  title: 'Settings',
  layout: 'app',
})

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
</script>

<template>
  <div>
    Hello {{ user?.email }}!
  </div>
</template>
