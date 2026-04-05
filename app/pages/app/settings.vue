<script setup lang="ts">
import { useGoogleCalendar, useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useSettings } from '@features/settings'
import { useUserStore } from '@features/auth/stores/user'
import EventColorSettings from '@features/settings/components/EventColorSettings.vue'

definePageMeta({
  title: 'Settings',
  layout: 'app',
})

const { connectGoogle, fetchConnectedAccounts, deleteAccount } = useGoogleCalendar()
const { getUserPreferences, syncAccountColors } = useSettings()
const googleCalendarStore = useGoogleCalendarStore()
const userStore = useUserStore()

const { accounts, isLoading } = storeToRefs(googleCalendarStore)

const colorSettingsRef = ref<InstanceType<typeof EventColorSettings>>()
const route = useRoute()

// Unwrap the exposed refs from the child — Vue does not auto-unwrap nested ref accesses in templates
const isColorsDirty = computed(() => colorSettingsRef.value?.isDirty ?? false)
const isColorsSaving = computed(() => colorSettingsRef.value?.isSaving ?? false)

onMounted(async () => {
  if (!userStore.user) return
  await getUserPreferences(userStore.user.id)
  await fetchConnectedAccounts()
  await syncAccountColors(userStore.user.id, googleCalendarStore.accounts)

  // After Google OAuth callback redirects back here, clean up the URL
  if (route.query.google_connected) {
    useRouter().replace({ query: {} })
  }
})
</script>

<template>
  <div class="flex column flex-1 overflow-auto">
  
    <div class="p-6 space-y-8 max-w-4xl">
      <!-- Integrations -->
      <div class="space-y-4">
        <div>
          <p class="text-xs text-muted-foreground uppercase tracking-wider">Integrations</p>
          <h2 class="text-xl font-semibold mt-1">Google Calendar</h2>
        </div>

        <SupaButton
          v-if="accounts.length < 3"
          color="primary"
          @click="connectGoogle"
        >
          Connect Google account
        </SupaButton>

        <p v-if="isLoading" class="text-sm text-muted-foreground">Loading...</p>

        <div v-if="accounts.length" class="flex gap-4 w-full">
          <div
            v-for="account in accounts"
            :key="account.id"
            class="rounded-md border border-border p-4 space-y-2 flex-1"
          >
            <p class="font-semibold text-sm">{{ account.display_name || account.email }}</p>
            <p class="text-xs text-muted-foreground">{{ account.email }}</p>
            <SupaButton
              color="error"
              size="sm"
              :loading="isLoading"
              @click="deleteAccount(account.id)"
            >
              Delete account
            </SupaButton>
          </div>
        </div>

        <p v-else-if="!isLoading" class="text-sm text-muted-foreground">
          No connected Google accounts yet.
        </p>
      </div>

      <!-- Event colors -->
      <div class="space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wider">Appearance</p>
            <h2 class="text-xl font-semibold mt-1">Event Colors</h2>
            <p class="text-sm text-muted-foreground mt-1">
              Customize the color for each calendar source. Changes are previewed instantly.
            </p>
          </div>

          <!-- Actions — shown when dirty -->
          <div v-if="isColorsDirty" class="flex items-center gap-2 shrink-0 pt-6">
            <SupaButton
              variant="transparent"
              :disabled="isColorsSaving"
              @click="colorSettingsRef?.discard()"
            >
              Discard
            </SupaButton>
            <SupaButton
              color="primary"
              :loading="isColorsSaving"
              @click="colorSettingsRef?.save()"
            >
              Save changes
            </SupaButton>
          </div>
        </div>

        <EventColorSettings ref="colorSettingsRef" />
      </div>
    </div>
  </div>
</template>
