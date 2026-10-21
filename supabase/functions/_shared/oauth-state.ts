/**
 * Signed OAuth `state` parameter.
 *
 * Format: `<base64url(payload JSON)>.<base64url(HMAC-SHA256(secret, payloadPart))>`
 *
 * The signature means the callback can trust `userId` / `appOrigin` were issued
 * by `google-oauth-start` and not forged. `ts` bounds how long a state is usable.
 *
 * NOTE: signing alone does not stop a logged-in attacker from handing *their own*
 * valid consent URL to a victim. That is why `google-oauth-complete` additionally
 * requires `payload.userId === <JWT user>` of the session finishing the flow.
 */

export interface OAuthStatePayload {
  userId: string
  nonce: string
  ts: number
  appOrigin: string
}

export type OAuthStateErrorReason =
  | 'malformed'
  | 'bad_signature'
  | 'invalid_payload'
  | 'expired'
  | 'not_yet_valid'

export class OAuthStateError extends Error {
  constructor(public readonly reason: OAuthStateErrorReason) {
    super(`Invalid OAuth state: ${reason}`)
    this.name = 'OAuthStateError'
  }
}

export const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000
const CLOCK_SKEW_MS = 60 * 1000
const MAX_STATE_LENGTH = 4096

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(input: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(input)) {
    throw new OAuthStateError('malformed')
  }

  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return new Uint8Array(signature)
}

/** Constant-time string comparison (no early exit on the first mismatch). */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  const length = Math.max(aBytes.length, bBytes.length)

  let diff = aBytes.length ^ bBytes.length
  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }

  return diff === 0
}

function isPayload(value: unknown): value is OAuthStatePayload {
  if (!value || typeof value !== 'object') return false

  const record = value as Record<string, unknown>

  return (
    typeof record.userId === 'string' && record.userId.length > 0 &&
    typeof record.nonce === 'string' && record.nonce.length > 0 &&
    typeof record.ts === 'number' && Number.isFinite(record.ts) &&
    typeof record.appOrigin === 'string' && record.appOrigin.length > 0
  )
}

export async function signOAuthState(payload: OAuthStatePayload, secret: string): Promise<string> {
  if (!secret) throw new Error('OAuth state secret is empty')

  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)))
  const signature = base64UrlEncode(await hmacSha256(secret, body))

  return `${body}.${signature}`
}

export interface VerifyOAuthStateOptions {
  now?: number
  maxAgeMs?: number
}

export async function verifyOAuthState(
  state: unknown,
  secret: string,
  options: VerifyOAuthStateOptions = {},
): Promise<OAuthStatePayload> {
  if (!secret) throw new Error('OAuth state secret is empty')

  if (typeof state !== 'string' || state.length === 0 || state.length > MAX_STATE_LENGTH) {
    throw new OAuthStateError('malformed')
  }

  const parts = state.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new OAuthStateError('malformed')
  }

  const [body, signature] = parts as [string, string]
  const expected = base64UrlEncode(await hmacSha256(secret, body))

  if (!timingSafeEqual(signature, expected)) {
    throw new OAuthStateError('bad_signature')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(decoder.decode(base64UrlDecode(body)))
  } catch {
    throw new OAuthStateError('malformed')
  }

  if (!isPayload(parsed)) {
    throw new OAuthStateError('invalid_payload')
  }

  const now = options.now ?? Date.now()
  const maxAgeMs = options.maxAgeMs ?? OAUTH_STATE_MAX_AGE_MS

  if (parsed.ts > now + CLOCK_SKEW_MS) {
    throw new OAuthStateError('not_yet_valid')
  }

  if (now - parsed.ts > maxAgeMs) {
    throw new OAuthStateError('expired')
  }

  return parsed
}
