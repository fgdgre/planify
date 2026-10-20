<script setup lang="ts">
import { LandingNav, LandingHero, LandingFooter } from '@features/landing'

definePageMeta({ layout: false })

const title = 'Planify — all your calendars in one place'
const description = 'Planify brings several Google Calendars into one view and keeps notes attached to the events they belong to.'

useHead({
  title,
  meta: [
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  ],
})
</script>

<template>
  <div class="landing font-['Inter'] bg-white text-foreground">
    <LandingNav />
    <main>
      <LandingHero />
    </main>
    <LandingFooter />
  </div>
</template>
