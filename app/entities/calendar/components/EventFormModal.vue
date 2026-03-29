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

const isoToDate = (iso?: string): Date | undefined => {
  if (!iso) return undefined
  const d = new Date(iso.replace(/\[.*\]$/, ''))
  return isNaN(d.getTime()) ? undefined : d
}

const getInitialData = (): EventFormData => {
  if (props.mode === 'edit' && props.event) {
    return {
      title: props.event.title,
      description: props.event.description ?? '',
      location: props.event.location ?? '',
      date: {
        start: isoToDate(props.event.start_at),
        end: isoToDate(props.event.end_at),
      },
      all_day: props.event.all_day,
    }
  }

  return {
    title: '',
    description: '',
    location: '',
    date: {
      start: props.prefill?.date?.start,
      end: props.prefill?.date?.end,
    },
    all_day: props.prefill?.all_day ?? false,
  }
}

const formData = ref<EventFormData>(getInitialData())

const schema: ValidationSchema = {
  title: { required: { message: 'Title is required' } },
}

const errorMessages = ref<Record<string, string>>({})

const handleSubmit = async () => {
  const { error } = validateForm(formData, schema)
  if (error) {
    errorMessages.value = { ...error }
    return
  }

  if (!formData.value.date.start || !formData.value.date.end) {
    errorMessages.value = { date: 'Start and end dates are required' }
    return
  }

  errorMessages.value = {}
  saving.value = true

  const payload = {
    title: formData.value.title || null,
    description: formData.value.description || null,
    location: formData.value.location || null,
    start_at: formData.value.date.start.toISOString(),
    end_at: formData.value.date.end.toISOString(),
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
</script>

<template>
  <SupaModal
    scrollable-content
    show-close-button
    :title="mode === 'edit' ? 'Edit event' : 'New event'"
    :ui="{ wrapper: 'min-w-[400px]' }"
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

        <SupaDatePickerRange
          v-model="formData.date"
          label="Date"
          :error-message="errorMessages.date"
          :highlight-error="!!errorMessages.date"
          :ui="{ modal: 'z-100' }"
        />
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
