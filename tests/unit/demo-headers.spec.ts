import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs script shared with CI, no type declarations
import { headersFor, parseHeadersFile } from '../../scripts/serve-with-headers.mjs'

const rules = parseHeadersFile(readFileSync('public/_headers', 'utf8'))

describe('public/_headers', () => {
  it('allows only same-origin framing, in both header forms', () => {
    const headers = headersFor(rules, '/demo/calendar')

    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN')
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'self'")
    expect(headers['Content-Security-Policy']).not.toContain("frame-ancestors 'none'")
  })

  it('lets the sandboxed (opaque origin) iframe load scripts, styles and fonts', () => {
    expect(headersFor(rules, '/_nuxt/entry.abc.js')['Access-Control-Allow-Origin']).toBe('*')
    expect(headersFor(rules, '/fonts/inter-latin-var.woff2')['Access-Control-Allow-Origin']).toBe('*')
  })

  it('does not open CORS for pages or anything else', () => {
    expect(headersFor(rules, '/demo/calendar')['Access-Control-Allow-Origin']).toBeUndefined()
    expect(headersFor(rules, '/')['Access-Control-Allow-Origin']).toBeUndefined()
  })

  it('keeps the strict script policy and the CI hash placeholder', () => {
    const csp = headersFor(rules, '/')['Content-Security-Policy']

    expect(csp).toContain("script-src 'self' __NUXT_INLINE_SCRIPT_HASHES__;")
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/)
    expect(csp).toContain('upgrade-insecure-requests')
  })
})
