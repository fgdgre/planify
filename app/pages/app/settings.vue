<script setup lang="ts">
import ConnectGoogleCalendarModal from "@features/integrations/google-calendar/components/ConnectGoogleCalendarModal.vue";

definePageMeta({
  title: 'Settings',
  layout: 'app',
})

const isGoogleCalendarModalOpen = ref(false)

const handleGoogleCalendarAccounts = () => {
  isGoogleCalendarModalOpen.value = true
}
</script>

<template>
  <div>
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
  </div>
</template>
