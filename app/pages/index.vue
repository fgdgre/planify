<script setup lang="ts">
import { useLogout, useUserStore } from "@modules/auth";

const userStore = useUserStore()
const { profile } = storeToRefs(userStore)

const { loading, logout } = useLogout()
</script>

<template>
  <div>
    Hello {{ profile?.email }}!

    <SupaButton
      @click="logout"
      :loading="loading"
    >
      logout
    </SupaButton>
  </div>
</template>