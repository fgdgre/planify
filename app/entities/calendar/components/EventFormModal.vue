<script lang="ts" setup>
import { useInternalEvents } from '@entities/calendar/composables/useInternalEvents'
import { useCalendar } from '@entities/calendar/composables/calendar'
import { validateForm, type ValidationSchema } from '@features/validation'
import type { CalendarEventDisplay, EventFormData, EventFormMode } from '@entities/calendar'

const props = defineProps<{
  mode: EventFormMode
  prefill?: Partial<EventFormData> | null
  event?: CalendarEventDisplay | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { createEvent, updateEvent } = useInternalEvents()
const { fetchEvents } = useCalendar()

const saving = ref(false)

const toDatetimeLocal = (iso?: string) => {
  if (!iso) return ''
  const date = new Date(iso.replace(/\[.*\]$/, ''))
  if (isNaN(date.getTime())) return ''
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const toDateLocal = (iso?: string) => {
  if (!iso) return ''
  const date = new Date(iso.replace(/\[.*\]$/, ''))
  if (isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const getInitialData = (): EventFormData => {
  if (props.mode === 'edit' && props.event) {
    return {
      title: props.event.title,
      description: props.event.description ?? '',
      location: props.event.location ?? '',
      start_at: props.event.all_day ? toDateLocal(props.event.start_at) : toDatetimeLocal(props.event.start_at),
      end_at: props.event.all_day ? toDateLocal(props.event.end_at) : toDatetimeLocal(props.event.end_at),
      all_day: props.event.all_day,
    }
  }

  return {
    title: '',
    description: '',
    location: '',
    start_at: props.prefill?.all_day ? toDateLocal(props.prefill?.start_at) : toDatetimeLocal(props.prefill?.start_at),
    end_at: props.prefill?.all_day ? toDateLocal(props.prefill?.end_at) : toDatetimeLocal(props.prefill?.end_at),
    all_day: props.prefill?.all_day ?? false,
  }
}

const formData = ref<EventFormData>(getInitialData())

const schema: ValidationSchema = {
  title: { required: { message: 'Title is required' } },
  start_at: { required: { message: 'Start date is required' } },
  end_at: { required: { message: 'End date is required' } },
}

const errorMessages = ref<Record<string, string>>({})

const localToIso = (local: string, allDay: boolean): string => {
  if (allDay) {
    return new Date(local + 'T00:00:00').toISOString()
  }
  return new Date(local).toISOString()
}

const handleSubmit = async () => {
  const { error } = validateForm(formData, schema)
  if (error) {
    errorMessages.value = { ...error }
    return
  }

  errorMessages.value = {}
  saving.value = true

  const payload = {
    title: formData.value.title || null,
    description: formData.value.description || null,
    location: formData.value.location || null,
    start_at: localToIso(formData.value.start_at, formData.value.all_day),
    end_at: localToIso(formData.value.end_at, formData.value.all_day),
    all_day: formData.value.all_day,
  }

  let success = false

  if (props.mode === 'edit' && props.event) {
    const result = await updateEvent(props.event.id, payload)
    success = !!result
  } else {
    const result = await createEvent(payload)
    success = !!result
  }

  saving.value = false

  if (success) {
    emit('close')
    await fetchEvents()
  }
}

watch(() => formData.value.all_day, (allDay, wasAllDay) => {
  if (allDay === wasAllDay) return

  // Convert between datetime-local and date formats
  if (allDay) {
    formData.value.start_at = formData.value.start_at.split('T')[0] ?? ''
    formData.value.end_at = formData.value.end_at.split('T')[0] ?? ''
  } else {
    if (formData.value.start_at && !formData.value.start_at.includes('T')) {
      formData.value.start_at = formData.value.start_at + 'T09:00'
    }
    if (formData.value.end_at && !formData.value.end_at.includes('T')) {
      formData.value.end_at = formData.value.end_at + 'T10:00'
    }
  }
})
</script>

<template>
  <SupaModal
    scrollable-content
    show-close-button
    :title="mode === 'edit' ? 'Edit event' : 'New event'"
    @close="$emit('close')"
  >
    <template #default>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <SupaInput
          v-model="formData.title"
          label="Title"
          placeholder="Event title"
          :error-message="errorMessages.title"
          :highlight-error="!!errorMessages.title"
        />

        <SupaTextarea
          v-model="formData.description"
          label="Description"
          placeholder="Add a description..."
        />

        <SupaInput
          v-model="formData.location"
          label="Location"
          placeholder="Add a location..."
        />

        <div class="flex items-center gap-2">
          <SupaSwitch v-model="formData.all_day" label="All day" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium mb-1 block">Start</label>
            <input
              v-model="formData.start_at"
              :type="formData.all_day ? 'date' : 'datetime-local'"
              class="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
            <p v-if="errorMessages.start_at" class="text-xs text-red-500 mt-1">{{ errorMessages.start_at }}</p>
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">End</label>
            <input
              v-model="formData.end_at"
              :type="formData.all_day ? 'date' : 'datetime-local'"
              class="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
            <p v-if="errorMessages.end_at" class="text-xs text-red-500 mt-1">{{ errorMessages.end_at }}</p>
          </div>
        </div>
      </form>
    </template>

    <template #actions>
      <div class="flex gap-2 w-full">
        <SupaButton
          color="primary"
          :loading="saving"
          @click="handleSubmit"
        >
          {{ mode === 'edit' ? 'Save' : 'Create' }}
        </SupaButton>
        <SupaButton variant="transparent" @click="$emit('close')">
          Cancel
        </SupaButton>
      </div>
    </template>
  </SupaModal>
</template>
