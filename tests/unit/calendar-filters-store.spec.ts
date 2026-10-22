import { reactive, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const userState = reactive<{ user: { id: string } | null }>({ user: null })
vi.mock('@features/auth/stores/user', () => ({ useUserStore: () => userState }))

import { useCalendarFiltersStore } from '@entities/calendar/stores/calendar-filters'

const keyFor = (id: string) => `planify:calendar-filters:${id}`

describe('calendar filters store', () => {
  beforeEach(() => {
    localStorage.clear()
    userState.user = null
    setActivePinia(createPinia())
  })

  it('toggles a source on and off', () => {
    const store = useCalendarFiltersStore()

    store.toggleSource('acc-1')
    expect(store.hiddenSources).toEqual(['acc-1'])

    store.toggleSource('acc-1')
    expect(store.hiddenSources).toEqual([])
  })

  it('sets one source visible or hidden without duplicates', () => {
    const store = useCalendarFiltersStore()

    store.setSourceVisible('a', false)
    store.setSourceVisible('a', false)
    expect(store.hiddenSources).toEqual(['a'])

    store.setSourceVisible('a', true)
    expect(store.hiddenSources).toEqual([])
  })

  it('hides and shows a whole group', () => {
    const store = useCalendarFiltersStore()
    store.setSourceVisible('keep', false)

    store.setGroupVisible(['a', 'b'], false)
    expect(store.hiddenSources.sort()).toEqual(['a', 'b', 'keep'])

    store.setGroupVisible(['a', 'b'], true)
    expect(store.hiddenSources).toEqual(['keep'])
  })

  it('sets and clears the search query', () => {
    const store = useCalendarFiltersStore()

    store.setSearchQuery('acme')
    expect(store.searchQuery).toBe('acme')

    store.clearSearch()
    expect(store.searchQuery).toBe('')
  })

  it('saves hidden sources under a per-user key', () => {
    userState.user = { id: 'u1' }
    const store = useCalendarFiltersStore()

    store.toggleSource('acc-1')

    expect(JSON.parse(localStorage.getItem(keyFor('u1'))!)).toEqual(['acc-1'])
    expect(localStorage.getItem(keyFor('u2'))).toBeNull()
  })

  it('loads the saved state once the user is known and when it changes', async () => {
    localStorage.setItem(keyFor('u1'), JSON.stringify(['a']))
    localStorage.setItem(keyFor('u2'), JSON.stringify(['b']))
    const store = useCalendarFiltersStore()
    expect(store.hiddenSources).toEqual([])

    userState.user = { id: 'u1' }
    await nextTick()
    expect(store.hiddenSources).toEqual(['a'])

    userState.user = { id: 'u2' }
    await nextTick()
    expect(store.hiddenSources).toEqual(['b'])
  })

  it('ignores corrupt saved data', async () => {
    localStorage.setItem(keyFor('u1'), 'not json')
    const store = useCalendarFiltersStore()

    userState.user = { id: 'u1' }
    await nextTick()

    expect(store.hiddenSources).toEqual([])
  })

  it('reset clears state but keeps the saved choice', () => {
    userState.user = { id: 'u1' }
    const store = useCalendarFiltersStore()
    store.toggleSource('a')
    store.setSearchQuery('x')

    userState.user = null
    store.reset()

    expect(store.hiddenSources).toEqual([])
    expect(store.searchQuery).toBe('')
    expect(JSON.parse(localStorage.getItem(keyFor('u1'))!)).toEqual(['a'])
  })
})
