<script setup lang="ts">
import AppSettingsPage from '../app/settings.vue'

// Same meta as the real page; the page itself runs unchanged on the in-memory database.
definePageMeta({
  title: 'Settings',
  layout: 'app',
})
</script>

<template>
  <AppSettingsPage />
</template>
