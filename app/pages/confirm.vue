<script setup lang="ts">
import { ROUTES } from "~/shared/constants/routes";
import { useUserStore } from "~/auth/stores/user";

const userStore = useUserStore()

const supabase = useSupabaseClient()

// FIXME: refactor
const { data } = supabase.auth.onAuthStateChange((event, session) => {
  console.log(event)
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
    userStore.setProfile(session?.user)
    return navigateTo(ROUTES.HOME)
  }
})
</script>

<template>
  <div class="flex flex-col h-full justify-center items-center max-w-96 w-full mx-auto gap-4">
    <div class="text-center">
      <div class="flex gap-2 items-center">
        Confirming your emal <SupaSpinner />
      </div>
      <br/>
      <br/>
      check your inbox ;)
    </div>
  </div>
</template>