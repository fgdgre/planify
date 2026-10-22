<script setup lang="ts">
import AppHomePage from '../app/index.vue'

// Same meta as the real page; the page itself runs unchanged on the in-memory database.
definePageMeta({
  title: 'Home',
  layout: 'app',
  middleware: ['google-calendar-events'],
})
</script>

<template>
  <AppHomePage />
</template>
