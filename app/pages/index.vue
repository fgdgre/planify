<script setup lang="ts">
import { logout } from "~/auth/composables/logout";

</script>

<template>
  <div>
    index

    <SupaButton @click="logout">
      logout
    </SupaButton>
  </div>
</template>