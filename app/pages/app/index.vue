<script setup lang="ts">
import { useLogout, useUserStore } from "@features/auth";

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const { loading, logout } = useLogout()
</script>

<template>
  <div>
    Hello {{ user?.email }}!

    <SupaButton
      @click="logout"
      :loading="loading"
    >
      logout
    </SupaButton>

  </div>
</template>
