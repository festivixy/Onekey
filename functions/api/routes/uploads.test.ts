import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import app from '../app'
import { ensureSchema } from '../../../test/apply-migrations'
import { hashPassword } from '../lib/password'

beforeAll(async () => { await ensureSchema() })
beforeEach(async () => { await env.DB.exec('DELETE FROM users') })

async function adminCookie(): Promise<string> {
  await env.DB.prepare(`INSERT INTO users (id, username, email, password_hash, role, is_active, created_at) VALUES ('a1','admin','a@x.com',?,'admin',1,'2020-01-01T00:00:00.000Z')`).bind(await hashPassword('pw')).run()
  const res = await app.request('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'pw' }) }, env)
  return res.headers.get('set-cookie')!
}

test('POST /api/uploads requires admin', async () => {
  const fd = new FormData()
  fd.append('file', new File([new Uint8Array([1])], 't.jpg', { type: 'image/jpeg' }))
  expect((await app.request('/api/uploads', { method: 'POST', body: fd }, env)).status).toBe(401)
})

test('POST /api/uploads stores the image and returns the upload metadata', async () => {
  const cookie = await adminCookie()
  const fd = new FormData()
  fd.append('file', new File([new Uint8Array([9, 9, 9])], 'avatar.png', { type: 'image/png' }))
  const res = await app.request('/api/uploads', { method: 'POST', headers: { cookie }, body: fd }, env)
  const body = await res.json() as any
  expect(res.status).toBe(200)
  expect(body.data.originalName).toBe('avatar.png')
  expect(body.data.size).toBe(3)
  expect(body.data.filePath).toMatch(/^\/api\/files\/team\/\d+_avatar\.png$/)
  const key = body.data.filePath.replace('/api/files/', '')
  const stored = await env.BUCKET.get(key)
  expect(stored).not.toBeNull()
  await stored?.body?.cancel()
})

test('POST /api/uploads rejects a non-image', async () => {
  const cookie = await adminCookie()
  const fd = new FormData()
  fd.append('file', new File([new Uint8Array([1])], 'x.pdf', { type: 'application/pdf' }))
  expect((await app.request('/api/uploads', { method: 'POST', headers: { cookie }, body: fd }, env)).status).toBe(400)
})
