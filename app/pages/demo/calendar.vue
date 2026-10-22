<script setup lang="ts">
import AppCalendarPage from '../app/calendar.vue'

// Same meta as the real page; the page itself runs unchanged on the in-memory database.
definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})
</script>

<template>
  <AppCalendarPage />
</template>
