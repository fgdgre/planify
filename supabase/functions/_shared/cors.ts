import { getAllowedOrigins, resolveAllowedOrigin } from './origins.ts'

/**
 * CORS headers that echo the caller's `Origin` only when it is allow-listed.
 * Unknown origins get no `Access-Control-Allow-Origin` at all, so the browser
 * blocks the response. `Vary: Origin` keeps caches from mixing answers.
 */
export function buildCorsHeaders(
  req: Request,
  allowedOrigins: readonly string[] = getAllowedOrigins(),
): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  }

  const origin = resolveAllowedOrigin(req.headers.get('Origin'), allowedOrigins)

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}
