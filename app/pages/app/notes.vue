<script setup lang="ts">
import { useNotes, useNotesStore } from '@features/notes'
import type { NotesLinkedFilter } from '@features/notes/stores/notes'
import NotesList from "@features/notes/components/NotesList.vue";

definePageMeta({
  layout: 'app',
  title: 'Notes',
})

const notesStore = useNotesStore()
const { search, filters, hasActiveFilters, hasMore, loading } = storeToRefs(notesStore)
const { refreshNotes, loadMoreNotes } = useNotes()

const route = useRoute()
const router = useRouter()

const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer')

useInfiniteScroll(
  scrollContainer,
  () => loadMoreNotes(),
  {
    distance: 200,
    canLoadMore: () => hasMore.value && !loading.value,
  }
)

await refreshNotes()

const searchInput = ref(search.value)
const debouncedRefresh = useDebounceFn(() => refreshNotes(), 350)

watch(searchInput, (val) => {
  notesStore.setSearch(val)
  debouncedRefresh()
})

const setLinkedFilter = (linked: NotesLinkedFilter) => {
  if (filters.value.linked === linked) return
  notesStore.setFilters({ linked })
  refreshNotes()
}

const dateRange = ref<{ start?: Date; end?: Date }>({
  start: filters.value.dateFrom ? new Date(filters.value.dateFrom) : undefined,
  end: filters.value.dateTo ? new Date(filters.value.dateTo) : undefined,
})

watch(
  dateRange,
  (val) => {
    const start = val?.start ?? undefined
    const end = val?.end ?? undefined
    const endOfDay = end ? new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1) : null
    notesStore.setFilters({
      dateFrom: start ? start.toISOString() : null,
      dateTo: endOfDay ? endOfDay.toISOString() : null,
    })
    refreshNotes()
  },
  { deep: true }
)

const clearFilters = () => {
  searchInput.value = ''
  dateRange.value = { start: undefined, end: undefined }
  notesStore.resetFilters()
  refreshNotes()
}

const linkedOptions: { value: NotesLinkedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'linked', label: 'Linked to event' },
  { value: 'unlinked', label: 'Standalone' },
]

const openCreateNote = async () => {
  await router.replace({
    query: {
      ...route.query,
      noteId: undefined,
      noteAction: 'create',
      action: undefined,
    },
  })
}
</script>

<template>
  <div ref="scrollContainer" class="flex flex-col flex-1 overflow-auto">
    <div class="flex flex-col flex-1 p-4 gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <SupaInput
          v-model="searchInput"
          placeholder="Search notes..."
          leading-icon="lucide:search"
          class="flex-1 min-w-[240px]"
          :ui="{ wrapper: 'w-full' }"
        />
        <SupaButton color="primary" @click="openCreateNote">
          Create Note
        </SupaButton>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1 rounded-md border border-border p-1">
          <button
            v-for="option in linkedOptions"
            :key="option.value"
            type="button"
            class="rounded px-3 py-1 text-xs font-medium transition-colors"
            :class="filters.linked === option.value
              ? 'bg-primary text-[#18181b]'
              : 'text-placeholder hover:text-foreground'"
            @click="setLinkedFilter(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <SupaDatePickerRange
          v-model="dateRange"
          size="sm"
          :ui="{ modal: 'z-100' }"
        />

        <SupaButton
          v-if="hasActiveFilters"
          variant="transparent"
          size="sm"
          @click="clearFilters"
        >
          Clear filters
        </SupaButton>
      </div>

      <NotesList />
    </div>
  </div>
</template>
