import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SupaButton from '@shared/ui/button/SupaButton.vue'

describe('SupaButton', () => {
  it('renders the slot content', () => {
    const wrapper = mount(SupaButton, { slots: { default: 'Save' } })
    expect(wrapper.text()).toBe('Save')
  })

  it('defaults to type="button" so it does not submit forms accidentally', () => {
    const wrapper = mount(SupaButton)
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('emits click events with the native event', async () => {
    const wrapper = mount(SupaButton, { slots: { default: 'Click me' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('click')![0][0]).toBeInstanceOf(MouseEvent)
  })

  it('disables the button while loading and renders the spinner instead of the icon', () => {
    const wrapper = mount(SupaButton, {
      props: { loading: true, icon: 'heroicons:check' },
      slots: { default: 'Saving...' },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="button-icon"]').exists()).toBe(false)
  })

  it('renders the leading icon when not loading', () => {
    const wrapper = mount(SupaButton, {
      props: { icon: 'heroicons:plus' },
      slots: { default: 'Add' },
    })
    expect(wrapper.find('[data-testid="button-icon"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(false)
  })

  it('honors the testId prop on the data-testid attribute', () => {
    const wrapper = mount(SupaButton, { props: { testId: 'submit-login' } })
    expect(wrapper.attributes('data-testid')).toBe('submit-login')
  })

  it('falls back to a default testId when none is provided', () => {
    const wrapper = mount(SupaButton)
    expect(wrapper.attributes('data-testid')).toBe('supa-button')
  })

  it('respects an explicit disabled prop even without loading', () => {
    const wrapper = mount(SupaButton, { props: { disabled: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
