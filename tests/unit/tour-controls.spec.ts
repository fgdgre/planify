import { effectScope, shallowRef } from 'vue'
import { describe, expect, it } from 'vitest'
import { registerControls } from '@entities/calendar/composables/tour-controls'

describe('registerControls', () => {
  it('publishes the handle and clears it when the scope is disposed', () => {
    const handle = shallowRef<{ id: number } | null>(null)
    const scope = effectScope()

    scope.run(() => registerControls(handle, { id: 1 }))
    expect(handle.value).toEqual({ id: 1 })

    scope.stop()
    expect(handle.value).toBeNull()
  })

  it('does not clear a newer registration', () => {
    const handle = shallowRef<{ id: number } | null>(null)
    const first = effectScope()

    first.run(() => registerControls(handle, { id: 1 }))
    effectScope().run(() => registerControls(handle, { id: 2 }))
    first.stop()

    expect(handle.value).toEqual({ id: 2 })
  })

  it('works outside an effect scope', () => {
    const handle = shallowRef<{ id: number } | null>(null)

    expect(() => registerControls(handle, { id: 1 })).not.toThrow()
    expect(handle.value).toEqual({ id: 1 })
  })
})
