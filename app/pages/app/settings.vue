<script setup lang="ts">
import ConnectGoogleCalendarModal from "@features/integrations/google-calendar/components/ConnectGoogleCalendarModal.vue";
import { useGoogleCalendar, useGoogleCalendarStore } from "@features/integrations/google-calendar";

definePageMeta({
  title: 'Settings',
  layout: 'app',
})

const isGoogleCalendarModalOpen = ref(false)

const handleGoogleCalendarAccounts = () => {
  isGoogleCalendarModalOpen.value = true
}

const {
  connectGoogle,
  fetchConnectedAccounts,
  fetchCalendarEvents,
  syncEvents,
} = useGoogleCalendar()

const googleCalendarStore = useGoogleCalendarStore()

const {
  getAccounts,
  getCalendarEvents,
  isLoading,
} = storeToRefs(googleCalendarStore)

const errorMessage = ref('')

onMounted(fetchConnectedAccounts)
</script>

<template>
  <div class="p-4">
    <div>
      <p>Integrations</p>
      <p>Google Calendar</p>
      <div class="p-6 space-y-6">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold">Google integrations</h1>
          <button
            v-if="getAccounts.length < 3"
            class="rounded bg-black px-4 py-2 text-white"
            @click="connectGoogle"
          >
            Connect Google account
          </button>
        </div>

        <p v-if="isLoading">Loading...</p>
        <p v-if="errorMessage" class="text-red-600">
          {{ errorMessage }}
        </p>

        <div v-if="getAccounts.length" class="flex gap-4 w-full">
          <div
            v-for="account in getAccounts"
            :key="account.id"
            class="rounded border p-4 space-y-3 flex-1"
          >
            <div>
              <p class="font-semibold">{{ account.display_name || account.email }}</p>
              <p class="text-sm text-gray-500">{{ account.email }}</p>
            </div>
            <div>
              <p>Events color:</p>

              <div class="bg-red-500 size-10 rounded-full"/>
              <div class="bg-green-400 size-10 rounded-full"/>
              <div class="bg-blue-400 size-10 rounded-full"/>
            </div>
            <SupaButton color="error">
              Delete account
            </SupaButton>
          </div>
        </div>

        <p v-else-if="!isLoading">No connected Google accounts yet.</p>
      </div>
    </div>


  </div>
</template>
