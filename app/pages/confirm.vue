<script setup lang="ts">
import { ROUTES } from "~/shared/constants/routes";

definePageMeta({ name: 'confirm' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const { data } = supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)
  if (event === 'INITIAL_SESSION') {
    console.log('INITIAL_SESSION')
  } else if (event === 'SIGNED_IN') {
    console.log('SIGNED_IN')
    return navigateTo('/')
  } else if (event === 'SIGNED_OUT') {
    console.log('SIGNED_OUT')
    return navigateTo('/login')
  } else if (event === 'PASSWORD_RECOVERY') {
    console.log('PASSWORD_RECOVERY')
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('TOKEN_REFRESHED')
  } else if (event === 'USER_UPDATED') {
    console.log('USER_UPDATED')
    return navigateTo('/')
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