<script setup lang="ts">
import { useGoogleCalendar } from "@features/integrations/google-calendar/composables/useGoogleCalendar";
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";
import { useNotification } from "@features/notification";

defineEmits<{
  close: [],
}>()

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
  <SupaModal
    :ui="{ wrapper: 'max-w-[450px]' }"
    :scrollable-content="true"
    @close="$emit('close')"
  >
    <div class="p-6 space-y-6">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold">Google integrations</h1>
        <button
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

      <div v-if="getAccounts.length" class="space-y-6">
        <div
          v-for="account in getAccounts"
          :key="account.id"
          class="rounded border p-4 space-y-3"
        >
          <div>
            <p class="font-semibold">{{ account.display_name || account.email }}</p>
            <p class="text-sm text-gray-500">{{ account.email }}</p>
          </div>

          <div class="flex gap-3">
            <button
              class="rounded border px-3 py-2"
              @click="fetchCalendarEvents(account.id)"
            >
              Load calendars
            </button>

            <button
              class="rounded border px-3 py-2"
              @click="syncEvents(account.id)"
            >
              Sync events
            </button>
          </div>

          <div v-if="getCalendarEvents?.[account.id]?.length" class="space-y-2">
            <p class="font-medium">Calendars:</p>
            <ul class="list-disc pl-5">
              <li
                v-for="calendar in getCalendarEvents[account.id]"
                :key="calendar.id"
              >
                {{ calendar.summary || calendar.id }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p v-else-if="!isLoading">No connected Google accounts yet.</p>
    </div>
  </SupaModal>
</template>
