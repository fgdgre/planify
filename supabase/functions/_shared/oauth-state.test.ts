import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1'
import {
  OAUTH_STATE_MAX_AGE_MS,
  OAuthStateError,
  signOAuthState,
  verifyOAuthState,
  type OAuthStatePayload,
} from './oauth-state.ts'

const SECRET = 'test-secret-0123456789'
const NOW = 1_760_000_000_000

const payload: OAuthStatePayload = {
  userId: '11111111-1111-4111-8111-111111111111',
  nonce: 'nonce-1',
  ts: NOW,
  appOrigin: 'https://planiifyy.netlify.app',
}

async function expectReason(promise: Promise<unknown>, reason: OAuthStateError['reason']) {
  const error = await assertRejects(() => promise, OAuthStateError)
  assertEquals(error.reason, reason)
}

Deno.test('signs and verifies a round trip', async () => {
  const state = await signOAuthState(payload, SECRET)

  assert(!state.includes('+') && !state.includes('/') && !state.includes('='), 'state must be URL safe')
  assertEquals(await verifyOAuthState(state, SECRET, { now: NOW + 1000 }), payload)
})

Deno.test('rejects a tampered payload', async () => {
  const state = await signOAuthState(payload, SECRET)
  const forged = await signOAuthState({ ...payload, userId: 'attacker' }, 'other-secret')
  const [, goodSignature] = state.split('.')
  const [forgedBody] = forged.split('.')

  await expectReason(verifyOAuthState(`${forgedBody}.${goodSignature}`, SECRET, { now: NOW }), 'bad_signature')
})

Deno.test('rejects a state signed with a different secret', async () => {
  const state = await signOAuthState(payload, 'another-secret')

  await expectReason(verifyOAuthState(state, SECRET, { now: NOW }), 'bad_signature')
})

Deno.test('rejects an unsigned base64 state (the pre-fix format)', async () => {
  const legacy = btoa(JSON.stringify(payload))

  await expectReason(verifyOAuthState(legacy, SECRET, { now: NOW }), 'malformed')
})

Deno.test('rejects malformed input', async () => {
  await expectReason(verifyOAuthState('', SECRET), 'malformed')
  await expectReason(verifyOAuthState('a.b.c', SECRET), 'malformed')
  await expectReason(verifyOAuthState(42, SECRET), 'malformed')
  await expectReason(verifyOAuthState('x'.repeat(5000), SECRET), 'malformed')
})

Deno.test('rejects a state older than the max age', async () => {
  const state = await signOAuthState(payload, SECRET)

  await expectReason(
    verifyOAuthState(state, SECRET, { now: NOW + OAUTH_STATE_MAX_AGE_MS + 1 }),
    'expired',
  )
})

Deno.test('rejects a state issued in the future beyond clock skew', async () => {
  const state = await signOAuthState(payload, SECRET)

  await expectReason(verifyOAuthState(state, SECRET, { now: NOW - 5 * 60 * 1000 }), 'not_yet_valid')
})

Deno.test('rejects a validly signed payload with missing fields', async () => {
  const broken = await signOAuthState({ ...payload, userId: '' } as OAuthStatePayload, SECRET)

  await expectReason(verifyOAuthState(broken, SECRET, { now: NOW }), 'invalid_payload')
})

Deno.test('refuses to work with an empty secret', async () => {
  await assertRejects(() => signOAuthState(payload, ''), Error, 'secret is empty')
  await assertRejects(() => verifyOAuthState('a.b', ''), Error, 'secret is empty')
})
