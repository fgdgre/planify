import { afterEach, describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import LandingDemoApp from './LandingDemoApp.vue'

function mountApp() {
  return mount(LandingDemoApp, { props: { step: null }, attachTo: document.body })
}

function findButton(wrapper: ReturnType<typeof mountApp>, text: string) {
  const button = wrapper.findAll('button').find((item) => item.text().includes(text))
  if (!button) throw new Error(`button not found: ${text}`)
  return button
}

function findEvent(wrapper: ReturnType<typeof mountApp>, title: string) {
  const event = wrapper.findAll('[data-event]').find((item) => item.text().includes(title))
  if (!event) throw new Error(`event not found: ${title}`)
  return event
}

async function pointer(wrapper: { element: Element }, type: string, clientX = 10, clientY = 10) {
  const event = new MouseEvent(type, { bubbles: true, clientX, clientY })
  Object.defineProperty(event, 'isPrimary', { value: true })
  wrapper.element.dispatchEvent(event)
  await nextTick()
}

describe('LandingDemoApp', () => {
  it('hides and shows an account events from the sidebar', async () => {
    const wrapper = mountApp()
    expect(wrapper.findAll('[data-event]')).toHaveLength(13)

    await findButton(wrapper, 'acme.com').trigger('click')
    expect(wrapper.findAll('[data-event]')).toHaveLength(9)

    await findButton(wrapper, 'acme.com').trigger('click')
    expect(wrapper.findAll('[data-event]')).toHaveLength(13)
    wrapper.unmount()
  })

  it('opens the panel for an event and adds a note to it', async () => {
    const wrapper = mountApp()
    await pointer(findEvent(wrapper, 'Studio call'), 'pointerdown', 10, 10)
    await pointer(findEvent(wrapper, 'Studio call'), 'pointerup', 10, 10)

    const panel = wrapper.find('[data-panel]')
    expect(panel.exists()).toBe(true)
    expect(panel.text()).toContain('Synced from Google')
    expect(panel.findAll('[data-note]')).toHaveLength(1)

    await findButton(wrapper, 'Add note').trigger('click')
    await wrapper.find('textarea').setValue('Send the QA report')
    await findButton(wrapper, 'Save note').trigger('click')

    expect(wrapper.find('[data-panel]').findAll('[data-note]')).toHaveLength(2)
    wrapper.unmount()
  })

  it('marks events that match the search', async () => {
    const wrapper = mountApp()
    await wrapper.find('input').setValue('studio')
    expect(wrapper.findAll('[data-hit]')).toHaveLength(3)
    expect(wrapper.text()).toContain('3 results')
    wrapper.unmount()
  })

  it('does not move a Google event when it is dragged', async () => {
    const wrapper = mountApp()
    const event = findEvent(wrapper, 'Studio review')
    const day = event.attributes('data-day')
    const start = event.attributes('data-start')

    await pointer(event, 'pointerdown', 100, 100)
    await pointer(event, 'pointermove', 200, 100)
    await pointer(event, 'pointerup', 200, 100)

    const after = findEvent(wrapper, 'Studio review')
    expect(after.attributes('data-day')).toBe(day)
    expect(after.attributes('data-start')).toBe(start)
    expect(wrapper.find('[data-panel]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits takeControl on pointerdown and keeps its state when the tour step changes', async () => {
    const wrapper = mountApp()
    await pointer(wrapper, 'pointerdown')
    expect(wrapper.emitted('takeControl')).toHaveLength(1)

    await pointer(findEvent(wrapper, 'Studio call'), 'pointerdown', 10, 10)
    await pointer(findEvent(wrapper, 'Studio call'), 'pointerup', 10, 10)
    await findButton(wrapper, 'Add note').trigger('click')
    await wrapper.find('textarea').setValue('Extra note')
    await findButton(wrapper, 'Save note').trigger('click')
    expect(wrapper.findAll('[data-note]')).toHaveLength(2)

    await wrapper.setProps({ step: 1 })
    expect(wrapper.findAll('[data-note]')).toHaveLength(2)
    wrapper.unmount()
  })

  it('opens the panel from the keyboard', async () => {
    const wrapper = mountApp()
    await findEvent(wrapper, 'Studio call').trigger('keydown', { key: 'Enter' })
    expect(wrapper.find('[data-panel]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('ignores drags that start with a non-primary button', async () => {
    const wrapper = mountApp()
    const event = findEvent(wrapper, 'Deep work')
    const down = new MouseEvent('pointerdown', { bubbles: true, button: 2, clientX: 10, clientY: 10 })
    Object.defineProperty(down, 'isPrimary', { value: true })
    event.element.dispatchEvent(down)
    await pointer(event, 'pointerup')
    expect(wrapper.find('[data-panel]').exists()).toBe(false)
    wrapper.unmount()
  })

  async function openEvent(wrapper: ReturnType<typeof mountApp>, title: string) {
    await pointer(findEvent(wrapper, title), 'pointerdown', 10, 10)
    await pointer(findEvent(wrapper, title), 'pointerup', 10, 10)
  }

  async function createEvent(wrapper: ReturnType<typeof mountApp>, title: string) {
    await findButton(wrapper, '+ New event').trigger('click')
    await wrapper.find('#demo-event-title').setValue(title)
    await wrapper.find('#demo-event-day').setValue('3')
    await wrapper.find('#demo-event-start').setValue('10')
    await wrapper.find('#demo-event-end').setValue('11')
    await findButton(wrapper, 'Save').trigger('submit')
  }

  it('creates an own event from the New event form', async () => {
    const wrapper = mountApp()
    await createEvent(wrapper, 'Client call')

    expect(wrapper.find('[data-event-form]').exists()).toBe(false)
    expect(wrapper.findAll('[data-event]')).toHaveLength(14)
    const created = findEvent(wrapper, 'Client call')
    expect(created.attributes('data-day')).toBe('3')
    expect(created.attributes('data-start')).toBe('10')
    expect(created.classes()).toContain('cursor-grab')
    wrapper.unmount()
  })

  it('disables Save for an empty title and explains a bad time range', async () => {
    const wrapper = mountApp()
    await findButton(wrapper, '+ New event').trigger('click')
    expect(findButton(wrapper, 'Save').attributes('disabled')).toBeDefined()

    await wrapper.find('#demo-event-title').setValue('Call')
    await wrapper.find('#demo-event-start').setValue('12')
    await wrapper.find('#demo-event-end').setValue('11')
    expect(wrapper.find('[data-form-error]').text()).toBe('End must be after start')
    expect(findButton(wrapper, 'Save').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('opens the form from an empty spot of the grid', async () => {
    const wrapper = mountApp()
    await wrapper.find('[data-grid]').trigger('click')
    expect(wrapper.find('[data-event-form]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('edits and deletes an own event', async () => {
    const wrapper = mountApp()
    await openEvent(wrapper, 'Deep work')
    await findButton(wrapper, 'Edit').trigger('click')
    await wrapper.find('#demo-event-title').setValue('Focus time')
    await findButton(wrapper, 'Save').trigger('submit')
    expect(findEvent(wrapper, 'Focus time').exists()).toBe(true)
    expect(wrapper.findAll('[data-event]')).toHaveLength(13)

    await findButton(wrapper, 'Delete').trigger('click')
    expect(wrapper.find('[data-event-form]').text()).toContain('Delete this event?')
    await findButton(wrapper, 'Yes').trigger('click')
    expect(wrapper.findAll('[data-event]')).toHaveLength(12)
    wrapper.unmount()
  })

  it('has no Edit or Delete for a Google event', async () => {
    const wrapper = mountApp()
    await openEvent(wrapper, 'Studio call')
    const labels = wrapper.find('[data-panel]').findAll('button').map((item) => item.text())
    expect(labels).not.toContain('Edit')
    expect(labels).not.toContain('Delete')
    wrapper.unmount()
  })

  it('edits and deletes a note', async () => {
    const wrapper = mountApp()
    await openEvent(wrapper, 'Studio call')
    await wrapper.find('[aria-label="Edit note"]').trigger('click')
    await wrapper.find('[data-note-body]').setValue('Report is due Monday')
    await findButton(wrapper, 'Save').trigger('click')
    expect(wrapper.find('[data-note]').text()).toContain('Report is due Monday')

    await wrapper.find('[aria-label="Delete note"]').trigger('click')
    await findButton(wrapper, 'Yes').trigger('click')
    expect(wrapper.findAll('[data-note]')).toHaveLength(0)
    wrapper.unmount()
  })

  it('shows dashboard numbers that follow the events', async () => {
    const wrapper = mountApp()
    const stat = (name: string) => wrapper.find(`[data-stat="${name}"] b`).text()
    expect(stat('events')).toBe('13')
    expect(stat('accounts')).toBe('3')

    await createEvent(wrapper, 'Client call')
    expect(stat('events')).toBe('14')

    await findButton(wrapper, 'acme.com').trigger('click')
    expect(stat('events')).toBe('10')
    wrapper.unmount()
  })

  describe('tour step 2', () => {
    afterEach(() => vi.useRealTimers())

    it('types and saves Client call once, even when the step is visited again', async () => {
      vi.useFakeTimers()
      const wrapper = mount(LandingDemoApp, { props: { step: 2 }, attachTo: document.body })
      await vi.advanceTimersByTimeAsync(3000)
      expect(wrapper.findAll('[data-event]').filter((item) => item.text().includes('Client call'))).toHaveLength(1)
      expect(wrapper.findAll('[data-event]')).toHaveLength(14)

      await wrapper.setProps({ step: 5 })
      await wrapper.setProps({ step: 2 })
      await vi.advanceTimersByTimeAsync(3000)
      expect(wrapper.findAll('[data-event]')).toHaveLength(14)
      wrapper.unmount()
    })
  })
})
