<script setup lang="ts">
import { logout } from "~/auth/composables/logout";
import { useUserStore } from "~/auth/stores/user";

const userStore = useUserStore()
const {
  profile,
} = storeToRefs(userStore)
</script>

<template>
  <div>
    Hello {{ profile?.email }}!

    <SupaButton @click="logout">
      logout
    </SupaButton>
  </div>
</template>