<script setup lang="ts">
definePageMeta({ name: 'confirm' })

const user = useSupabaseUser()

onMounted(async () => {
  // Give the client a moment to process the callback and populate user
  // (simple approach)
  // (simple approach)
  const start = Date.now()
  while (!user.value && Date.now() - start < 1500) {
    await new Promise((r) => setTimeout(r, 50))
  }

  // Redirect where you want after confirmation
  if (user.value) {
    return navigateTo('/')
  }

  // If still no user, send them to login
  return navigateTo('/login')
})
</script>

<template>
  <div class="flex flex-col h-full justify-center items-center max-w-96 w-full mx-auto gap-4">
    <SupaSpinner />
    <div class="text-center">
      Confirming your email…
    </div>
  </div>
</template>