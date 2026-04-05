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

const dateToTimeStr = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
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

// Time state — separate from the date range picker (which strips time)
const startTime = ref('09:00')
const endTime = ref('10:00')

if (props.mode === 'edit' && props.event && !props.event.all_day) {
  const s = isoToDate(props.event.start_at)
  const e = isoToDate(props.event.end_at)
  if (s) startTime.value = dateToTimeStr(s)
  if (e) endTime.value = dateToTimeStr(e)
} else if (props.prefill?.date?.start) {
  startTime.value = dateToTimeStr(props.prefill.date.start)
  endTime.value = props.prefill.date.end ? dateToTimeStr(props.prefill.date.end) : startTime.value
}

const schema: ValidationSchema = {
  title: { required: { message: 'Title is required' } },
}

const errorMessages = ref<Record<string, string>>({})

const applyTime = (date: Date, timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const d = new Date(date.getTime())
  d.setHours(hours, minutes, 0, 0)
  return d
}

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

  const startDate = formData.value.all_day
    ? formData.value.date.start
    : applyTime(formData.value.date.start, startTime.value)

  const endDate = formData.value.all_day
    ? formData.value.date.end
    : applyTime(formData.value.date.end, endTime.value)

  const payload = {
    title: formData.value.title || null,
    description: formData.value.description || null,
    location: formData.value.location || null,
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
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

        <!-- Time pickers — only when not all day -->
        <div v-if="!formData.all_day" class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-foreground">Start time</label>
            <input
              v-model="startTime"
              type="time"
              class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-foreground">End time</label>
            <input
              v-model="endTime"
              type="time"
              class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </form>
    </template>

    <template #actions>
      <div class="flex gap-2 w-full">
        <SupaButton color="primary" :loading="saving" @click="handleSubmit">
          {{ mode === 'edit' ? 'Save' : 'Create' }}
        </SupaButton>
        <SupaButton variant="transparent" @click="$emit('close')">Cancel</SupaButton>
      </div>
    </template>
  </SupaModal>
</template>
