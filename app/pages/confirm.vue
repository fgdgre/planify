<script setup lang="ts">
definePageMeta({ name: 'confirm' })

const user = useSupabaseUser()

onMounted(async () => {
  const start = Date.now()
  while (!user.value && Date.now() - start < 1500) {
    await new Promise((r) => setTimeout(r, 50))
  }

  if (user.value) {
    return navigateTo('/')
  }

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