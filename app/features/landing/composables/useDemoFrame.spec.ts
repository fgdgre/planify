import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { READY_TIMEOUT_MS, useDemoFrame } from './useDemoFrame'

const demoMessage = (extra: object) => ({ source: 'planify-demo', version: 1, ...extra })

let intersect: () => void
let observed = 0

class FakeIntersectionObserver {
  constructor(private callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
    intersect = () => this.callback([{ isIntersecting: true }])
  }
  observe() { observed++ }
  disconnect() {}
}

function setup({ enabled = true } = {}) {
  const enabledRef = ref(enabled)
  let api!: ReturnType<typeof useDemoFrame>
  const posted: unknown[] = []

  const Host = defineComponent({
    setup() {
      const section = ref<HTMLElement | null>(null)
      const frame = ref<HTMLIFrameElement | null>(null)
      api = useDemoFrame({ section, frame, enabled: enabledRef, demoUrl: '/demo/calendar' })
      return () => h('div', { ref: section }, api.iframeSrc.value ? [h('iframe', { ref: frame, src: api.iframeSrc.value })] : [])
    },
  })

  const wrapper = mount(Host, { attachTo: document.body })
  const iframe = () => wrapper.find('iframe').element as HTMLIFrameElement
  /** Delivers a message as if the iframe had posted it. */
  const fromFrame = async (data: object, source: MessageEventSource | null = iframe().contentWindow) => {
    window.dispatchEvent(new MessageEvent('message', { data: demoMessage(data), source }))
    await nextTick()
  }
  const nearAndIdle = async () => {
    intersect()
    await vi.advanceTimersByTimeAsync(250)
  }
  const spyOnFrame = () => vi.spyOn(iframe().contentWindow!, 'postMessage').mockImplementation((message) => void posted.push(message))

  return { api: () => api, wrapper, enabledRef, posted, fromFrame, nearAndIdle, spyOnFrame }
}

describe('useDemoFrame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    observed = 0
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    vi.stubGlobal('requestIdleCallback', undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('keeps the poster and creates no iframe until the section is near and the browser idle', async () => {
    const { api, wrapper } = setup()

    expect(api().status.value).toBe('poster')
    expect(wrapper.find('iframe').exists()).toBe(false)

    intersect()
    await vi.advanceTimersByTimeAsync(50)
    expect(wrapper.find('iframe').exists()).toBe(false)

    await vi.advanceTimersByTimeAsync(200)
    expect(api().status.value).toBe('loading')
    expect(wrapper.find('iframe').attributes('src')).toBe('/demo/calendar')
  })

  it('never loads when disabled (small screen or save-data)', async () => {
    const { api, wrapper } = setup({ enabled: false })

    expect(observed).toBe(0)
    await vi.advanceTimersByTimeAsync(500)
    expect(api().status.value).toBe('poster')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })

  it('shows the iframe on ready and sends the current step', async () => {
    const { api, nearAndIdle, fromFrame, spyOnFrame, posted } = setup()
    await nearAndIdle()
    await nextTick()
    spyOnFrame()
    api().goToStep(3)

    await fromFrame({ type: 'ready' })

    expect(api().status.value).toBe('ready')
    expect(posted).toEqual([{ source: 'planify-landing', version: 1, type: 'step', step: 3 }])
  })

  it('forwards step changes only once ready', async () => {
    const { api, nearAndIdle, fromFrame, spyOnFrame, posted } = setup()
    await nearAndIdle()
    await nextTick()
    spyOnFrame()

    api().goToStep(2)
    expect(posted).toEqual([])

    await fromFrame({ type: 'ready' })
    api().goToStep(4)
    expect(posted.at(-1)).toMatchObject({ type: 'step', step: 4 })
  })

  it('ignores messages from other windows and malformed payloads', async () => {
    const { api, nearAndIdle, fromFrame } = setup()
    await nearAndIdle()
    await nextTick()

    await fromFrame({ type: 'ready' }, window)
    await fromFrame({ type: 'unknown' })
    expect(api().status.value).toBe('loading')
  })

  it.each([
    ['error', { type: 'error', reason: 'boom' }],
    ['step-failed', { type: 'step-failed', step: 2, reason: 'no calendar' }],
  ])('falls back to the poster for good on %s', async (_name, message) => {
    const { api, wrapper, nearAndIdle, fromFrame } = setup()
    await nearAndIdle()
    await nextTick()
    await fromFrame({ type: 'ready' })

    await fromFrame(message)
    await nextTick()

    expect(api().status.value).toBe('fallback')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })

  it('falls back when ready never arrives', async () => {
    const { api, nearAndIdle } = setup()
    await nearAndIdle()

    await vi.advanceTimersByTimeAsync(READY_TIMEOUT_MS)

    expect(api().status.value).toBe('fallback')
  })

  it('does not fall back after ready arrived in time', async () => {
    const { api, nearAndIdle, fromFrame } = setup()
    await nearAndIdle()
    await nextTick()
    await fromFrame({ type: 'ready' })

    await vi.advanceTimersByTimeAsync(READY_TIMEOUT_MS * 2)

    expect(api().status.value).toBe('ready')
  })

  it('takeControl pauses the tour locally and tells the demo', async () => {
    const { api, nearAndIdle, fromFrame, spyOnFrame, posted } = setup()
    await nearAndIdle()
    await nextTick()
    await fromFrame({ type: 'ready' })
    spyOnFrame()

    api().takeControl()
    api().takeControl()

    expect(api().controlled.value).toBe(true)
    expect(posted).toEqual([{ source: 'planify-landing', version: 1, type: 'take-control' }])
  })

  it('pauses the tour on user-took-control and resumes with the current step', async () => {
    const { api, nearAndIdle, fromFrame, spyOnFrame, posted } = setup()
    await nearAndIdle()
    await nextTick()
    await fromFrame({ type: 'ready' })
    spyOnFrame()

    await fromFrame({ type: 'user-took-control' })
    expect(api().controlled.value).toBe(true)

    api().goToStep(4)
    expect(posted).toEqual([])

    api().resume()
    expect(api().controlled.value).toBe(false)
    expect(posted).toEqual([
      { source: 'planify-landing', version: 1, type: 'resume' },
      { source: 'planify-landing', version: 1, type: 'step', step: 4 },
    ])
  })
})
