<script setup lang="ts">
import { landingEffects, LandingNav, LandingHero, LandingPain, LandingDemo, LandingFeatureCards, LandingSteps, LandingFooter } from '@features/landing'

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
  // Inter is self-hosted (see main.css): the CSP allows fonts from 'self' only,
  // and the landing makes no third-party requests.
  link: [
    { rel: 'preload', href: '/fonts/inter-latin-var.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
  ],
})
</script>

<template>
  <div class="landing font-['Inter'] bg-white text-foreground">
    <LandingNav />
    <main>
      <LandingHero />
      <LandingPain />
      <LandingDemo v-if="landingEffects.demo" />
      <LandingFeatureCards v-else />
      <LandingSteps />
    </main>
    <LandingFooter />
  </div>
</template>
