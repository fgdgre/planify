<script setup lang="ts">
import AppNotesPage from '../app/notes.vue'

// Same meta as the real page; the page itself runs unchanged on the in-memory database.
definePageMeta({
  layout: 'app',
  title: 'Notes',
})
</script>

<template>
  <AppNotesPage />
</template>
