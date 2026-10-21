import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@1'
import { HttpError, errorResponse, jsonResponse, readJsonBody, requireUuid } from './http.ts'

Deno.test('jsonResponse sets JSON content type and no-store', async () => {
  const res = jsonResponse({ ok: true }, { status: 201, headers: { 'X-Test': '1' } })

  assertEquals(res.status, 201)
  assertEquals(res.headers.get('Content-Type'), 'application/json')
  assertEquals(res.headers.get('Cache-Control'), 'no-store')
  assertEquals(res.headers.get('X-Test'), '1')
  assertEquals(await res.json(), { ok: true })
})

Deno.test('errorResponse exposes only the code of a known HttpError', async () => {
  const res = errorResponse(new HttpError(404, 'google_account_not_found', 'row 42 missing for user x'))

  assertEquals(res.status, 404)
  assertEquals(await res.json(), { error: 'google_account_not_found' })
})

Deno.test('errorResponse hides details of unexpected errors', async () => {
  const originalError = console.error
  console.error = () => {}

  try {
    const res = errorResponse(new Error('Missing env variable: GOOGLE_CLIENT_SECRET'))

    assertEquals(res.status, 500)
    assertEquals(await res.json(), { error: 'internal_error' })
  } finally {
    console.error = originalError
  }
})

Deno.test('readJsonBody rejects non-object and invalid JSON bodies', async () => {
  const bad = new Request('https://fn.example', { method: 'POST', body: 'nope' })
  const error = await assertRejects(() => readJsonBody(bad), HttpError)
  assertEquals(error.code, 'invalid_json')

  const notObject = new Request('https://fn.example', { method: 'POST', body: '"str"' })
  await assertRejects(() => readJsonBody(notObject), HttpError)
})

Deno.test('requireUuid accepts UUIDs and rejects everything else', () => {
  assertEquals(requireUuid('11111111-1111-4111-8111-111111111111'), '11111111-1111-4111-8111-111111111111')
  assertThrows(() => requireUuid('1 OR 1=1'), HttpError)
  assertThrows(() => requireUuid(undefined), HttpError)
  assertThrows(() => requireUuid({ id: 'x' }), HttpError)
})
