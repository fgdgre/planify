import { assertEquals } from 'jsr:@std/assert@1'
import {
  buildAllowedOrigins,
  normalizeOrigin,
  parseOriginList,
  resolveAllowedOrigin,
} from './origins.ts'

Deno.test('normalizeOrigin strips paths, queries and trailing slashes', () => {
  assertEquals(normalizeOrigin('https://planiifyy.netlify.app/app/settings?x=1'), 'https://planiifyy.netlify.app')
  assertEquals(normalizeOrigin('http://localhost:3000/'), 'http://localhost:3000')
})

Deno.test('normalizeOrigin rejects garbage and non-http schemes', () => {
  assertEquals(normalizeOrigin(''), null)
  assertEquals(normalizeOrigin(null), null)
  assertEquals(normalizeOrigin('not a url'), null)
  assertEquals(normalizeOrigin('javascript:alert(1)'), null)
  assertEquals(normalizeOrigin('file:///etc/passwd'), null)
})

Deno.test('parseOriginList splits on commas and drops invalid entries', () => {
  assertEquals(
    parseOriginList(' https://a.example , nope, http://b.example:8080/path '),
    ['https://a.example', 'http://b.example:8080'],
  )
  assertEquals(parseOriginList(undefined), [])
})

Deno.test('buildAllowedOrigins merges base, extras and dev origins without duplicates', () => {
  const allowed = buildAllowedOrigins({
    APP_BASE_URL: 'https://planiifyy.netlify.app/',
    APP_ALLOWED_ORIGINS: 'https://preview.example,http://localhost:3000',
  })

  assertEquals(allowed, [
    'https://planiifyy.netlify.app',
    'https://preview.example',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ])
})

Deno.test('resolveAllowedOrigin only accepts allow-listed origins', () => {
  const allowed = ['https://planiifyy.netlify.app', 'http://localhost:3000']

  assertEquals(resolveAllowedOrigin('https://planiifyy.netlify.app/anything', allowed), 'https://planiifyy.netlify.app')
  assertEquals(resolveAllowedOrigin('https://evil.example', allowed), null)
  assertEquals(resolveAllowedOrigin('https://planiifyy.netlify.app.evil.example', allowed), null)
  assertEquals(resolveAllowedOrigin('http://planiifyy.netlify.app', allowed), null)
  assertEquals(resolveAllowedOrigin(null, allowed), null)
})
