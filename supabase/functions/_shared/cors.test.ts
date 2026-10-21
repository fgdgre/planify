import { assertEquals } from 'jsr:@std/assert@1'
import { buildCorsHeaders } from './cors.ts'

const ALLOWED = ['https://planiifyy.netlify.app', 'http://localhost:3000']

Deno.test('echoes an allow-listed origin and varies on it', () => {
  const req = new Request('https://fn.example/x', { headers: { Origin: 'http://localhost:3000' } })
  const headers = buildCorsHeaders(req, ALLOWED)

  assertEquals(headers['Access-Control-Allow-Origin'], 'http://localhost:3000')
  assertEquals(headers['Vary'], 'Origin')
})

Deno.test('omits Access-Control-Allow-Origin for unknown origins', () => {
  const req = new Request('https://fn.example/x', { headers: { Origin: 'https://evil.example' } })
  const headers = buildCorsHeaders(req, ALLOWED)

  assertEquals(headers['Access-Control-Allow-Origin'], undefined)
  assertEquals(headers['Vary'], 'Origin')
})

Deno.test('never answers with a wildcard', () => {
  const req = new Request('https://fn.example/x')
  const headers = buildCorsHeaders(req, ALLOWED)

  assertEquals(headers['Access-Control-Allow-Origin'], undefined)
})
