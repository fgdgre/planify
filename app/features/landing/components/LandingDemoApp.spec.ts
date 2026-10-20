import { describe, it, expect } from 'vitest'
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
})
