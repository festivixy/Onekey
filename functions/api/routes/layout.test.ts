import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import app from '../app'
import { ensureSchema } from '../../../test/apply-migrations'
import { hashPassword } from '../lib/password'

beforeAll(async () => { await ensureSchema() })
beforeEach(async () => { await env.DB.exec('DELETE FROM settings'); await env.DB.exec('DELETE FROM users') })

async function adminCookie(): Promise<string> {
  await env.DB.prepare(`INSERT INTO users (id, username, email, password_hash, role, is_active, created_at) VALUES ('a1','admin','a@x.com',?,'admin',1,'2020-01-01T00:00:00.000Z')`).bind(await hashPassword('pw')).run()
  const res = await app.request('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'pw' }) }, env)
  return res.headers.get('set-cookie')!
}

test('GET /api/team-layout returns null when unset', async () => {
  const res = await app.request('/api/team-layout', {}, env)
  expect((await res.json() as any).data.layout).toBeNull()
})

test('PUT /api/team-layout (admin) upserts and GET returns it', async () => {
  const cookie = await adminCookie()
  const layout = { intro: 'hello', order: ['founders'], hidden: [], sections: { founders: { mode: 'grid', perRow: { desktop: 4, tablet: 3, phone: 1 }, size: 'standard', shape: 'rounded' } } }
  const put = await app.request('/api/team-layout', { method: 'PUT', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ layout }) }, env)
  expect(put.status).toBe(200)
  const get = await app.request('/api/team-layout', {}, env)
  expect((await get.json() as any).data.layout).toEqual(layout)
})

test('PUT /api/team-layout rejects anonymous', async () => {
  const res = await app.request('/api/team-layout', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ layout: {} }) }, env)
  expect(res.status).toBe(401)
})

test('PUT /api/team-layout rejects non-object layout', async () => {
  const cookie = await adminCookie()
  const res = await app.request('/api/team-layout', { method: 'PUT', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ layout: [1, 2] }) }, env)
  expect(res.status).toBe(400)
})
