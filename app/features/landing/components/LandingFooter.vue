<script setup lang="ts">
import { ROUTES } from '@shared/constants/routes'
</script>

<template>
  <section class="mx-5 mb-10 rounded-[28px] bg-primary-deep px-5 py-16 text-center text-white tablet:mx-10 tablet:px-10 tablet:py-20">
    <h2 class="text-3xl font-semibold tracking-[-0.035em] tablet:text-5xl">Stop juggling calendars.</h2>
    <p class="mt-3.5 mb-7 text-[17px] text-[#ece9f7]">Bring every account into one calm place.</p>
    <NuxtLink
      :to="ROUTES.SIGNUP"
      class="inline-block rounded-[9px] bg-white px-[18px] py-[11px] text-sm font-semibold text-primary-deep"
    >
      Connect Google Calendar
    </NuxtLink>
  </section>

  <footer class="flex flex-col items-center justify-between gap-3 border-t border-border px-5 pt-6 pb-8 text-[13px] text-placeholder tablet:flex-row tablet:px-10">
    <span class="flex items-center gap-2 text-[15px] font-semibold text-foreground">
      <span class="inline-block size-[22px] rounded-md bg-primary" />
      Planify
    </span>
    <span class="flex gap-4">
      <NuxtLink :to="ROUTES.PRIVACY_POLICY">Privacy Policy</NuxtLink>
      <NuxtLink :to="ROUTES.TERMS_OF_SERVICE">Terms of Service</NuxtLink>
      <span>© 2026</span>
    </span>
  </footer>
</template>
