import { env } from 'cloudflare:test'
import { expect, test } from 'vitest'
import app from '../app'

test('GET /api/files/:key streams a stored object with its content-type', async () => {
  await env.BUCKET.put('photos/onekey/pic.jpg', new Uint8Array([1, 2, 3, 4]), { httpMetadata: { contentType: 'image/jpeg' } })
  const res = await app.request('/api/files/photos/onekey/pic.jpg', {}, env)
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toBe('image/jpeg')
  expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 4]))
})

test('GET /api/files/:key returns 404 for a missing object', async () => {
  const res = await app.request('/api/files/nope/missing.jpg', {}, env)
  expect(res.status).toBe(404)
})
