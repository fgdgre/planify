<template>
  <main class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-4xl font-bold">Planify</h1>
    <p class="mt-4 text-lg">
      Planify helps users manage multiple Google Calendars in one place,
      sync events, and organize their schedule more easily.
    </p>

    <div class="mt-8 flex gap-4">
      <NuxtLink to="/login">Log in</NuxtLink>
      <NuxtLink to="/app">Open app</NuxtLink>
    </div>

    <footer class="mt-12 flex gap-6">
      <NuxtLink to="/privacy-policy">Privacy Policy</NuxtLink>
      <NuxtLink to="/terms-of-service">Terms of Service</NuxtLink>
    </footer>
  </main>
</template>
