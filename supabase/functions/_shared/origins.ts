/// <reference lib="deno.ns" />

/**
 * Origin allow-list shared by every Edge Function.
 *
 * Only origins listed here may (a) call the functions from a browser (CORS),
 * (b) be used as the post-OAuth redirect target, and (c) appear in a signed
 * OAuth state. Anything else is rejected before any work happens.
 *
 * Sources, merged and de-duplicated:
 *   - APP_BASE_URL            (required, the production app origin)
 *   - APP_ALLOWED_ORIGINS     (optional, comma-separated extra origins, e.g. preview deploys)
 *   - local dev origins       (http://localhost:3000, http://127.0.0.1:3000)
 */

export const DEFAULT_DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'] as const

export interface OriginEnv {
  APP_BASE_URL?: string | null
  APP_ALLOWED_ORIGINS?: string | null
}

/** Reduce an arbitrary URL/origin string to `scheme://host[:port]`, or null when unusable. */
export function normalizeOrigin(candidate: string | null | undefined): string | null {
  if (!candidate) return null

  try {
    const url = new URL(candidate)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    return url.origin
  } catch {
    return null
  }
}

export function parseOriginList(raw: string | null | undefined): string[] {
  if (!raw) return []

  return raw
    .split(',')
    .map((part) => normalizeOrigin(part.trim()))
    .filter((origin): origin is string => origin !== null)
}

export function buildAllowedOrigins(env: OriginEnv): string[] {
  const origins = new Set<string>()

  const base = normalizeOrigin(env.APP_BASE_URL)
  if (base) origins.add(base)

  for (const origin of parseOriginList(env.APP_ALLOWED_ORIGINS)) {
    origins.add(origin)
  }

  for (const origin of DEFAULT_DEV_ORIGINS) {
    origins.add(origin)
  }

  return [...origins]
}

/** Returns the normalized origin when it is allow-listed, otherwise null. */
export function resolveAllowedOrigin(
  candidate: string | null | undefined,
  allowed: readonly string[],
): string | null {
  const origin = normalizeOrigin(candidate)

  if (!origin) return null

  return allowed.includes(origin) ? origin : null
}

// --- env-backed helpers (not used by unit tests) -----------------------------

export function getAllowedOrigins(): string[] {
  return buildAllowedOrigins({
    APP_BASE_URL: Deno.env.get('APP_BASE_URL'),
    APP_ALLOWED_ORIGINS: Deno.env.get('APP_ALLOWED_ORIGINS'),
  })
}

export function getDefaultAppOrigin(): string {
  const origin = normalizeOrigin(Deno.env.get('APP_BASE_URL'))

  if (!origin) {
    throw new Error('Missing or invalid env variable: APP_BASE_URL')
  }

  return origin
}
