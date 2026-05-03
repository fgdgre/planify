<script setup lang="ts">
import { ROUTES } from "@shared/constants/routes";
import { useUserStore } from "@features/auth";
import type { EmailOtpType } from "@supabase/supabase-js";

definePageMeta({
  layout: 'login',
})

const userStore = useUserStore()
const supabase = useSupabaseClient()
const route = useRoute()

const errorMessage = ref('')

// Plugin's global auth listener sets userStore.user on SIGNED_IN (this tab or
// cross-tab). Once user is set, navigate. Covers both:
//   - this tab finished verifyOtp / exchangeCodeForSession
//   - the original signup tab heard a SIGNED_IN broadcast from the new tab
watchEffect(() => {
  if (userStore.user) navigateTo(ROUTES.HOME)
})

onMounted(async () => {
  // Preferred path: ?token_hash=&type=signup (stateless, set via Supabase email template)
  const tokenHash = route.query.token_hash as string | undefined
  if (tokenHash) {
    const type = (route.query.type as string | undefined) ?? 'signup'
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })
    if (error) {
      errorMessage.value = error.message
      console.error('verifyOtp:', error.message)
    }
    return
  }

  // Fallback for legacy PKCE-style links (?code=…). Requires the verifier in
  // storage; will fail if the link is opened in a different browser/session.
  const code = route.query.code as string | undefined
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      errorMessage.value = error.message
      console.error('exchangeCodeForSession:', error.message)
    }
    return
  }

  // Tab that initiated signup (no token_hash, no code). If a session was
  // already established (e.g. confirmed before this tab loaded), redirect.
  const { data: { session } } = await supabase.auth.getSession()
  if (session) userStore.setUser(session.user)
})
</script>

<template>
  <div class="flex flex-col h-full justify-center items-center max-w-96 w-full mx-auto gap-4">
    <div class="text-center space-y-2">
      <div v-if="!errorMessage" class="flex gap-2 items-center justify-center">
        Confirming your email <SupaSpinner />
      </div>
      <p v-if="!errorMessage" class="text-sm text-muted-foreground">
        Check your inbox and click the link we sent you.
      </p>
      <p v-else class="text-sm text-destructive">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>
