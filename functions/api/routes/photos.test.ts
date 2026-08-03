import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import app from '../app'
import { ensureSchema } from '../../../test/apply-migrations'
import { hashPassword } from '../lib/password'

beforeAll(async () => { await ensureSchema() })
beforeEach(async () => { await env.DB.exec('DELETE FROM photos'); await env.DB.exec('DELETE FROM users') })

test('GET /api/photos returns serialized photos newest-first', async () => {
  await env.DB.prepare(`INSERT INTO photos (id,url,r2_key,category,filename,uploaded_at) VALUES ('p1','U1','photos/onekey/a.jpg','onekey','a.jpg','2024-01-01T00:00:00Z')`).run()
  await env.DB.prepare(`INSERT INTO photos (id,url,r2_key,category,filename,uploaded_at) VALUES ('p2','U2','photos/onekey/b.jpg','onekey','b.jpg','2024-02-01T00:00:00Z')`).run()
  const res = await app.request('/api/photos', {}, env)
  const body = await res.json() as any
  expect(body.data.photos.map((p: any) => p.id)).toEqual(['p2', 'p1'])
  expect(body.data.photos[0]).toMatchObject({ storagePath: 'photos/onekey/b.jpg', uploadedAt: '2024-02-01T00:00:00Z' })
})

async function photoAdminCookie(): Promise<string> {
  await env.DB.exec('DELETE FROM users')
  await env.DB.prepare(`INSERT INTO users (id, username, email, password_hash, role, is_active, created_at) VALUES ('a1','admin','a@x.com',?,'admin',1,'2020-01-01T00:00:00.000Z')`).bind(await hashPassword('pw')).run()
  const res = await app.request('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'pw' }) }, env)
  return res.headers.get('set-cookie')!
}

test('POST /api/photos requires admin', async () => {
  const fd = new FormData()
  fd.append('file', new File([new Uint8Array([1, 2])], 'p.jpg', { type: 'image/jpeg' }))
  fd.append('category', 'onekey')
  const res = await app.request('/api/photos', { method: 'POST', body: fd }, env)
  expect(res.status).toBe(401)
})

test('POST /api/photos uploads to R2, inserts a row, returns the record', async () => {
  const cookie = await photoAdminCookie()
  const fd = new FormData()
  fd.append('file', new File([new Uint8Array([1, 2, 3, 4])], 'pic.jpg', { type: 'image/jpeg' }))
  fd.append('category', 'onekey')
  const res = await app.request('/api/photos', { method: 'POST', headers: { cookie }, body: fd }, env)
  expect(res.status).toBe(200)
  const body = await res.json() as any
  expect(body.data.category).toBe('onekey')
  expect(body.data.url).toBe(`/api/files/${body.data.storagePath}`)
  expect(body.data.storagePath).toMatch(/^photos\/onekey\/\d+_pic\.jpg$/)
  // object actually landed in R2:
  const stored = await env.BUCKET.get(body.data.storagePath)
  expect(stored).not.toBeNull()
  await stored?.body?.cancel()
  // row landed in D1:
  expect((await env.DB.prepare('SELECT COUNT(*) AS n FROM photos').first<any>()).n).toBe(1)
})

test('POST /api/photos rejects a non-image', async () => {
  const cookie = await photoAdminCookie()
  const fd = new FormData()
  fd.append('file', new File([new Uint8Array([1])], 'bad.txt', { type: 'text/plain' }))
  fd.append('category', 'onekey')
  const res = await app.request('/api/photos', { method: 'POST', headers: { cookie }, body: fd }, env)
  expect(res.status).toBe(400)
})

test('POST /api/photos rejects an SVG', async () => {
  const cookie = await photoAdminCookie()
  const fd = new FormData()
  fd.append('file', new File([new Uint8Array([1])], 'bad.svg', { type: 'image/svg+xml' }))
  fd.append('category', 'onekey')
  const res = await app.request('/api/photos', { method: 'POST', headers: { cookie }, body: fd }, env)
  expect(res.status).toBe(400)
})

test('POST /api/photos requires a file field', async () => {
  const cookie = await photoAdminCookie()
  const fd = new FormData()
  fd.append('category', 'onekey')
  const res = await app.request('/api/photos', { method: 'POST', headers: { cookie }, body: fd }, env)
  expect(res.status).toBe(400)
})

test('PATCH /api/photos/:id updates the category', async () => {
  const cookie = await photoAdminCookie()
  await env.DB.prepare(`INSERT INTO photos (id,url,r2_key,category,filename,uploaded_at) VALUES ('p1','/api/files/photos/onekey/a.jpg','photos/onekey/a.jpg','onekey','a.jpg','c')`).run()
  const res = await app.request('/api/photos/p1', { method: 'PATCH', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ category: 'vanstring' }) }, env)
  expect(res.status).toBe(200)
  expect((await env.DB.prepare('SELECT category FROM photos WHERE id = ?').bind('p1').first<any>()).category).toBe('vanstring')
})

test('PATCH /api/photos/:id rejects a missing category', async () => {
  const cookie = await photoAdminCookie()
  await env.DB.prepare(`INSERT INTO photos (id,url,r2_key,category,filename,uploaded_at) VALUES ('p1','/api/files/photos/onekey/a.jpg','photos/onekey/a.jpg','onekey','a.jpg','c')`).run()
  const res = await app.request('/api/photos/p1', { method: 'PATCH', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({}) }, env)
  expect(res.status).toBe(400)
})

test('DELETE /api/photos/:id removes the R2 object and the row', async () => {
  const cookie = await photoAdminCookie()
  await env.BUCKET.put('photos/onekey/a.jpg', new Uint8Array([1]), { httpMetadata: { contentType: 'image/jpeg' } })
  await env.DB.prepare(`INSERT INTO photos (id,url,r2_key,category,filename,uploaded_at) VALUES ('p1','/api/files/photos/onekey/a.jpg','photos/onekey/a.jpg','onekey','a.jpg','c')`).run()
  const res = await app.request('/api/photos/p1', { method: 'DELETE', headers: { cookie } }, env)
  expect(res.status).toBe(200)
  expect(await env.BUCKET.get('photos/onekey/a.jpg')).toBeNull()
  expect((await env.DB.prepare('SELECT COUNT(*) AS n FROM photos').first<any>()).n).toBe(0)
})

test('PATCH/DELETE /api/photos require admin', async () => {
  expect((await app.request('/api/photos/p1', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ category: 'x' }) }, env)).status).toBe(401)
  expect((await app.request('/api/photos/p1', { method: 'DELETE' }, env)).status).toBe(401)
})
