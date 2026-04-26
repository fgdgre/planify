<script setup lang="ts">
import type { Note } from '@features/notes'
import { useNotesItem } from '../composables/notes-item'

const props = defineProps<{
  item: Note
}>()

const emit = defineEmits<{
  view: []
  delete: []
}>()

const itemRef = computed(() => props.item)
const { linkedEvent, formattedEventDate, cardItemActions } = useNotesItem(itemRef)

const handleItemAction = (action: unknown) => {
  if (typeof action !== 'string') return

  switch (action) {
    case 'view':
      emit('view')
      break
    case 'delete':
      emit('delete')
  }
}

</script>

<template>
  <div
    class="flex flex-col gap-4 rounded-[14px] p-6 border border-border min-w-[300px] max-w-[400px] cursor-pointer transition-colors hover:border-primary/40"
    role="button"
    tabindex="0"
    @click="emit('view')"
    @keydown.enter.prevent="emit('view')"
    @keydown.space.prevent="emit('view')"
  >
    <div class="flex justify-between">
      <div class="bg-primary/10 rounded-[10px] p-2">
        <SupaIcon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10.6667 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V5.33333L10.6667 2Z" stroke="#9688CF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 2V4.66667C10 5.02029 10.1405 5.35943 10.3905 5.60948C10.6406 5.85952 10.9797 6 11.3333 6H14" stroke="#9688CF" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </SupaIcon>
      </div>

        <div @click.stop>
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
