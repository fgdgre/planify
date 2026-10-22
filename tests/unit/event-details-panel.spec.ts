import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EventDetailsPanel from '@entities/calendar/components/EventDetailsPanel.vue'
import type { CalendarEventDisplay } from '@entities/calendar'

const event = (source: 'internal' | 'google'): CalendarEventDisplay => ({
  id: 'e1', title: 'Studio review', start_at: '2026-10-22T10:00:00.000Z', end_at: '2026-10-22T11:00:00.000Z', all_day: false, source,
})
const note = { id: 'n1', title: 'Existing note', content: '<p>x</p>' }

const mountPanel = (props: Record<string, unknown>) =>
  mount(EventDetailsPanel, {
    props,
    global: { stubs: { Icon: true, SupaRichText: true } },
  })

const addNoteButton = (wrapper: ReturnType<typeof mountPanel>) =>
  wrapper.findAll('button').find((b) => b.text().includes('Add note'))

describe('EventDetailsPanel Add note', () => {
  it('shows Add note for an own event in view mode', () => {
    expect(addNoteButton(mountPanel({ selectedEvent: event('internal'), showAddNote: true }))).toBeDefined()
  })

  it('shows Add note for a Google event even when it already has notes', () => {
    const wrapper = mountPanel({ selectedEvent: event('google'), eventNotes: [note], showAddNote: true, showActions: true })

    expect(wrapper.text()).toContain('Existing note')
    expect(addNoteButton(wrapper)).toBeDefined()
    expect(wrapper.text()).not.toContain('Delete')
  })

  it('hides Add note while the note panel is open', () => {
    expect(addNoteButton(mountPanel({ selectedEvent: event('google'), showAddNote: false }))).toBeUndefined()
  })

  it('emits addNote when clicked', async () => {
    const wrapper = mountPanel({ selectedEvent: event('google'), showAddNote: true })
    await addNoteButton(wrapper)!.trigger('click')

    expect(wrapper.emitted('addNote')).toHaveLength(1)
  })
})
