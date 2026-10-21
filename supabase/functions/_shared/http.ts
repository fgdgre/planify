/**
 * Small HTTP helpers so every Edge Function answers the same way:
 *   - JSON bodies with a stable `{ error: <code> }` shape
 *   - known failures carry an explicit status + machine-readable code
 *   - anything unexpected is logged server-side and returned as a generic 500
 *     (never the raw `error.message`, which may contain Google's JSON or env names)
 */

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'HttpError'
  }
}

export function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: HeadersInit } = {},
): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('Cache-Control', 'no-store')

  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers })
}

export function errorResponse(error: unknown, headers: HeadersInit = {}): Response {
  if (error instanceof HttpError) {
    if (error.status >= 500) {
      console.error(`[edge] ${error.code}:`, error.message)
    }

    return jsonResponse({ error: error.code }, { status: error.status, headers })
  }

  console.error('[edge] unhandled error:', error)

  return jsonResponse({ error: 'internal_error' }, { status: 500, headers })
}

export async function readJsonBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const body = await req.json()

    if (!body || typeof body !== 'object') {
      throw new HttpError(400, 'invalid_json')
    }

    return body as T
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'invalid_json')
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function requireUuid(value: unknown, code = 'invalid_request'): string {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new HttpError(400, code)
  }

  return value
}
