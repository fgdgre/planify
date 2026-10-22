import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { __resetDemoModeForTests, getTourTarget, useTourTarget } from '@shared/api/demo'

const Host = defineComponent({
  props: { shown: { type: Boolean, default: true } },
  setup(props) {
    const el = ref<HTMLElement | null>(null)
    useTourTarget('statsRow', el)
    return () => (props.shown ? h('section', { ref: el }) : h('span'))
  },
})

describe('tour targets', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
    __resetDemoModeForTests()
  })

  describe('in demo mode', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '/demo/calendar')
      __resetDemoModeForTests()
    })

    it('publishes the element while mounted and forgets it after', async () => {
      const wrapper = mount(Host)
      await nextTick()
      expect(getTourTarget('statsRow')).toBe(wrapper.element)

      wrapper.unmount()
      expect(getTourTarget('statsRow')).toBeNull()
    })

    it('forgets the element when the ref empties', async () => {
      const wrapper = mount(Host)
      await nextTick()

      await wrapper.setProps({ shown: false })
      await nextTick()

      expect(getTourTarget('statsRow')).toBeNull()
    })
  })

  it('does nothing outside demo mode', async () => {
    mount(Host)
    await nextTick()

    expect(getTourTarget('statsRow')).toBeNull()
  })
})
