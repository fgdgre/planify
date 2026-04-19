<script setup lang="ts">
import type { Note } from '@features/notes'

const props = defineProps<{
  item: Note
}>()

const emit = defineEmits<{
  delete: []
}>()

const supabase = useSupabaseClient()

const linkedEvent = ref<{ title: string; start_at: string } | null>(null)

const fetchLinkedEvent = async () => {
  if (!props.item.calendar_event_id) return

  const { data } = await supabase
    .from('calendar_events')
    .select('title, start_at')
    .eq('id', props.item.calendar_event_id)
    .single()

  if (data) linkedEvent.value = data
}

fetchLinkedEvent()

const formattedEventDate = computed(() => {
  if (!linkedEvent.value?.start_at) return ''
  return new Date(linkedEvent.value.start_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const cardItemActions = [
  {
    value: 'delete',
    label: 'Delete',
    icon: 'heroicons:trash',
  },
]

const handleItemAction = (action: string) => {
  switch (action) {
    case 'delete':
      emit('delete')
  }
}

</script>

<template>
  <div class="flex flex-col gap-4 rounded-[14px] p-6 border border-border min-w-[300px] max-w-[400px]">
    <div class="flex justify-between">
      <div class="bg-primary/10 rounded-[10px] p-2">
        <SupaIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10.6667 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V5.33333L10.6667 2Z" stroke="#9688CF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 2V4.66667C10 5.02029 10.1405 5.35943 10.3905 5.60948C10.6406 5.85952 10.9797 6 11.3333 6H14" stroke="#9688CF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </SupaIcon>
      </div>

        <SupaDropdown
          @update:model-value="handleItemAction"
          :items="cardItemActions"
          :ui="{ trigger: 'w-10 h-10 min-w-10 p-0 justify-center border-none shadow-none!' }"
        >
          <template #menuTrigger>
            <SupaIcon size="sm" name="pepicons-pencil:dots-y" />
          </template>
        </SupaDropdown>
    </div>


      <div class="flex flex-col gap-2">
        <p class="text-foreground font-medium text-[18px]">{{ item.title }}</p>

        <p class="text-placeholder text-sm">{{ item.content }}</p>

        <div v-if="linkedEvent" class="flex items-center gap-2 bg-[rgba(0,0,0,0.05)] rounded-md p-2">
            <SupaIcon>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <g clip-path="url(#clip0_1_1490)">
                  <path d="M4 1V3" stroke="black" stroke-opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 1V3" stroke="black" stroke-opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9.5 2H2.5C1.94772 2 1.5 2.44772 1.5 3V10C1.5 10.5523 1.94772 11 2.5 11H9.5C10.0523 11 10.5 10.5523 10.5 10V3C10.5 2.44772 10.0523 2 9.5 2Z" stroke="black" stroke-opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M1.5 5H10.5" stroke="black" stroke-opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                <defs>
                  <clipPath id="clip0_1_1490">
                    <rect width="12" height="12" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </SupaIcon>

          <div class="flex flex-col justify-center w-full overflow-hidden">
            <p class="truncate text-sm text-foreground">
              {{ linkedEvent.title }}
            </p>
            <p
              v-if="formattedEventDate"
              class="truncate text-xs text-placeholder">
              {{ formattedEventDate }}
            </p>
          </div>
        </div>
        <p class="text-placeholder">{{ item.created_at }}</p>
      </div>
  </div>
</template>
