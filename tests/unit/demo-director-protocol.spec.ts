import { describe, expect, it } from 'vitest'
import { parseDemoMessage, parseLandingMessage, toDemoMessage, toLandingMessage, describeError } from '@shared/api/demo'

const landing = (extra: object) => ({ source: 'planify-landing', version: 1, ...extra })
const demo = (extra: object) => ({ source: 'planify-demo', version: 1, ...extra })

describe('parseLandingMessage', () => {
  it.each([1, 2, 3, 4, 5])('accepts step %i', (step) => {
    expect(parseLandingMessage(landing({ type: 'step', step }))).toEqual(landing({ type: 'step', step }))
  })

  it('accepts resume', () => {
    expect(parseLandingMessage(landing({ type: 'resume' }))).toEqual(landing({ type: 'resume' }))
  })

  it.each([
    ['null', null],
    ['a string', 'step'],
    ['wrong source', { ...landing({ type: 'resume' }), source: 'evil' }],
    ['demo source', demo({ type: 'resume' })],
    ['other version', { ...landing({ type: 'resume' }), version: 2 }],
    ['missing version', { source: 'planify-landing', type: 'resume' }],
    ['step 0', landing({ type: 'step', step: 0 })],
    ['step 6', landing({ type: 'step', step: 6 })],
    ['step as string', landing({ type: 'step', step: '1' })],
    ['unknown type', landing({ type: 'reset' })],
  ])('rejects %s', (_, data) => {
    expect(parseLandingMessage(data)).toBeNull()
  })

  it('drops unknown fields', () => {
    expect(parseLandingMessage(landing({ type: 'step', step: 1, extra: 'x' }))).toEqual(landing({ type: 'step', step: 1 }))
  })
})

describe('parseDemoMessage', () => {
  it.each([
    demo({ type: 'ready' }),
    demo({ type: 'user-took-control' }),
    demo({ type: 'step-done', step: 3 }),
    demo({ type: 'step-ignored', step: 3 }),
    demo({ type: 'step-failed', step: 2, reason: 'boom' }),
    demo({ type: 'error', reason: 'boom' }),
  ])('accepts %j', (message) => {
    expect(parseDemoMessage(message)).toEqual(message)
  })

  it.each([
    ['landing source', landing({ type: 'ready' })],
    ['step-done without step', demo({ type: 'step-done' })],
    ['step-ignored with a bad step', demo({ type: 'step-ignored', step: 7 })],
    ['step-failed without reason', demo({ type: 'step-failed', step: 1 })],
    ['error with non-string reason', demo({ type: 'error', reason: 1 })],
    ['unknown type', demo({ type: 'hello' })],
  ])('rejects %s', (_, data) => {
    expect(parseDemoMessage(data)).toBeNull()
  })
})

describe('message builders', () => {
  it('add source and version', () => {
    expect(toDemoMessage({ type: 'ready' })).toEqual(demo({ type: 'ready' }))
    expect(toLandingMessage({ type: 'step', step: 4 })).toEqual(landing({ type: 'step', step: 4 }))
  })

  it('round-trips through the parsers', () => {
    const message = toDemoMessage({ type: 'step-failed', step: 5, reason: 'x' })
    expect(parseDemoMessage(message)).toEqual(message)
  })
})

describe('describeError', () => {
  it('uses the message of an Error, strings as they are, and a fallback otherwise', () => {
    expect(describeError(new Error('bad'))).toBe('bad')
    expect(describeError('plain')).toBe('plain')
    expect(describeError({ secret: 1 })).toBe('Unknown error')
  })

  it('keeps the text short', () => {
    expect(describeError('x'.repeat(1000))).toHaveLength(300)
  })
})
