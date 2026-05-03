<script setup lang="ts">
import { ROUTES } from "@shared/constants/routes";
import { useUserStore } from "@features/auth";

definePageMeta({
  layout: 'login',
})

const userStore = useUserStore()
const route = useRoute()

// Tab landing here from an email link carries ?code= or ?token_hash=. Either
// way, Supabase already marked the email confirmed before redirecting back —
// so just send the user to /login. They can sign in normally from there.
const isFromEmailLink = computed(() => Boolean(route.query.code || route.query.token_hash))

// If a session becomes available (e.g. user signs in on another tab), redirect.
watchEffect(() => {
  if (userStore.user) navigateTo(ROUTES.HOME)
})

onMounted(() => {
  if (isFromEmailLink.value) {
    setTimeout(() => navigateTo(ROUTES.LOGIN), 1200)
  }
})
</script>

<template>
  <div class="flex flex-col h-full justify-center items-center max-w-96 w-full mx-auto gap-4">
    <div class="text-center space-y-3">
      <template v-if="isFromEmailLink">
        <div class="flex gap-2 items-center justify-center">
          Email confirmed <SupaSpinner />
        </div>
        <p class="text-sm text-muted-foreground">Redirecting you to sign in…</p>
      </template>
      <template v-else>
        <div class="flex gap-2 items-center justify-center">
          Confirming your email <SupaSpinner />
        </div>
        <p class="text-sm text-muted-foreground">
          Check your inbox and click the link we sent you.
        </p>
        <NuxtLink
          :to="ROUTES.LOGIN"
          class="text-sm underline underline-offset-4 text-foreground hover:opacity-70"
        >
          Already confirmed? Sign in
        </NuxtLink>
      </template>
    </div>
  </div>
</template>
