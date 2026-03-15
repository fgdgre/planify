<script setup lang="ts">
import ConnectGoogleCalendarModal from "@features/integrations/google-calendar/components/ConnectGoogleCalendarModal.vue";

const isGoogleCalendarModalOpen = ref(false)

const handleGoogleCalendarAccounts = () => {
  isGoogleCalendarModalOpen.value = true
}
</script>

<template>
settings

  <div>
    <p>Integrations</p>
    <SupaButton @click="handleGoogleCalendarAccounts">
      Google calendar Accounts
    </SupaButton>
  </div>

  <ConnectGoogleCalendarModal
    v-if="isGoogleCalendarModalOpen"
    @close="isGoogleCalendarModalOpen = false"
  />
</template>
