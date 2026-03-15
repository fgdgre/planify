<script setup lang="ts">
import { useGoogleCalendar } from "@integrations/google-calendar/composables/useGoogleCalendar";

defineEmits<{
  close: [],
}>()

const {
  connectGoogle,
  getConnectedAccounts,
  loadCalendars,
  syncEvents,
} = useGoogleCalendar()

const accounts = ref<any[]>([])
const calendarsByAccount = ref<Record<string, any[]>>({})
const loading = ref(false)
const errorMessage = ref('')

const fetchAccounts = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    accounts.value = await getConnectedAccounts()
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to load accounts'
  } finally {
    loading.value = false
  }
}

const onConnectGoogle = async () => {
  try {
    await connectGoogle()
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to connect Google'
  }
}

const onLoadCalendars = async (accountId: string) => {
  try {
    errorMessage.value = ''
    const items = await loadCalendars(accountId)
    calendarsByAccount.value[accountId] = items
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to load calendars'
  }
}

const onSyncEvents = async (accountId: string) => {
  try {
    errorMessage.value = ''
    await syncEvents(accountId)
    alert('Events synced')
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to sync events'
  }
}

onMounted(fetchAccounts)
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
          @click="onConnectGoogle"
        >
          Connect Google account
        </button>
      </div>

      <p v-if="loading">Loading...</p>
      <p v-if="errorMessage" class="text-red-600">
        {{ errorMessage }}
      </p>

      <div v-if="accounts.length" class="space-y-6">
        <div
          v-for="account in accounts"
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
              @click="onLoadCalendars(account.id)"
            >
              Load calendars
            </button>

            <button
              class="rounded border px-3 py-2"
              @click="onSyncEvents(account.id)"
            >
              Sync events
            </button>
          </div>

          <div v-if="calendarsByAccount[account.id]?.length" class="space-y-2">
            <p class="font-medium">Calendars:</p>
            <ul class="list-disc pl-5">
              <li
                v-for="calendar in calendarsByAccount[account.id]"
                :key="calendar.id"
              >
                {{ calendar.summary || calendar.id }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p v-else-if="!loading">No connected Google accounts yet.</p>
    </div>
  </SupaModal>
</template>
