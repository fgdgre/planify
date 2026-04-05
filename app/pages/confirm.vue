<script setup lang="ts">
import { ROUTES } from "@shared/constants/routes";
import { useUserStore } from "@features/auth";

definePageMeta({
  layout: 'login',
})

const userStore = useUserStore()
const supabase = useSupabaseClient()
const route = useRoute()

// Listen for session changes from any source (e.g. confirmation in another tab)
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
    userStore.setUser(session.user)
    navigateTo(ROUTES.HOME)
  }
})

onMounted(async () => {
  // Implicit flow: confirmation emails carry ?token_hash=&type=signup
  const tokenHash = route.query.token_hash as string | undefined
  const type = (route.query.type as string | undefined) ?? 'signup'

  if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    })
    if (data?.session) {
      userStore.setUser(data.session.user)
      return navigateTo(ROUTES.HOME)
    }
    if (error) console.error('verifyOtp error:', error.message)
    return
  }

  // Fallback: if the session was already established (e.g. confirmed in another tab)
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    userStore.setUser(session.user)
    navigateTo(ROUTES.HOME)
  }
})

onUnmounted(() => {
  subscription.unsubscribe()
})
</script>

<template>
  <div class="flex flex-col h-full justify-center items-center max-w-96 w-full mx-auto gap-4">
    <div class="text-center space-y-2">
      <div class="flex gap-2 items-center justify-center">
        Confirming your email <SupaSpinner />
      </div>
      <p class="text-sm text-muted-foreground">Check your inbox and click the link we sent you.</p>
    </div>
  </div>
</template>
