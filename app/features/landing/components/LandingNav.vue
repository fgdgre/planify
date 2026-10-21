<script setup lang="ts">
import { ROUTES } from '@shared/constants/routes'

const { y } = useWindowScroll()
</script>

<template>
  <nav
    class="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white/70 px-5 text-sm backdrop-blur-md tablet:px-10"
    :class="y > 10 ? 'border-border' : 'border-transparent'"
  >
    <NuxtLink :to="ROUTES.LANDING" class="flex items-center gap-2 text-[15px] font-semibold">
      <span class="inline-block size-[22px] rounded-md bg-primary" />
      Planify
    </NuxtLink>

    <div class="hidden gap-7 text-placeholder tablet:flex">
      <a href="#product">Product</a>
      <a href="#how-it-works">How it works</a>
      <a href="#demo">Demo</a>
    </div>

    <div class="flex gap-2.5">
      <NuxtLink
        :to="ROUTES.LOGIN"
        class="rounded-[9px] border border-border bg-white px-4 py-2.5 font-semibold"
      >
        Log in
      </NuxtLink>
      <NuxtLink
        :to="ROUTES.SIGNUP"
        class="rounded-[9px] bg-primary px-4 py-2.5 font-semibold text-white shadow-[0_8px_24px_-10px_var(--primary-deep)]"
      >
        Start free
      </NuxtLink>
    </div>
  </nav>
</template>
