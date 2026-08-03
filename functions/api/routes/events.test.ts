import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import app from '../app'
import { ensureSchema } from '../../../test/apply-migrations'
import { hashPassword } from '../lib/password'

beforeAll(async () => { await ensureSchema() })
beforeEach(async () => { await env.DB.exec('DELETE FROM events'); await env.DB.exec('DELETE FROM users'); await env.DB.exec('DELETE FROM activity_logs') })

async function adminCookie(): Promise<string> {
  await env.DB.prepare(`INSERT INTO users (id, username, email, password_hash, role, is_active, created_at) VALUES ('a1','admin','a@x.com',?,'admin',1,'2020-01-01T00:00:00.000Z')`).bind(await hashPassword('pw')).run()
  const res = await app.request('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'pw' }) }, env)
  return res.headers.get('set-cookie')!
}

test('GET /api/events is public', async () => {
  await env.DB.prepare(`INSERT INTO events (id,name,date,category,created_at,updated_at) VALUES ('e1','Concert','2024-05-01','performance','c','u')`).run()
  const res = await app.request('/api/events', {}, env)
  const body = await res.json() as any
  expect(body.data.events[0]).toMatchObject({ id: 'e1', name: 'Concert', category: 'performance' })
})

test('POST /api/events creates an event (admin) and logs it', async () => {
  const cookie = await adminCookie()
  const res = await app.request('/api/events', { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ name: 'Gala', date: '2024-06-01', category: 'performance', location: 'Hall' }) }, env)
  const body = await res.json() as any
  expect(res.status).toBe(200)
  const row = await env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(body.data.id).first<any>()
  expect(row.name).toBe('Gala'); expect(row.location).toBe('Hall'); expect(row.created_at).toBeTruthy()
  expect((await env.DB.prepare('SELECT action FROM activity_logs').first<any>()).action).toBe('add_event')
})

test('POST /api/events rejects anonymous', async () => {
  const res = await app.request('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'X', date: 'd', category: 'c' }) }, env)
  expect(res.status).toBe(401)
})

test('PATCH /api/events/:id updates and bumps updated_at', async () => {
  const cookie = await adminCookie()
  await env.DB.prepare(`INSERT INTO events (id,name,date,category,created_at,updated_at) VALUES ('e1','Old','2024-01-01','performance','c','old')`).run()
  const res = await app.request('/api/events/e1', { method: 'PATCH', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ name: 'New' }) }, env)
  expect(res.status).toBe(200)
  const row = await env.DB.prepare('SELECT name, updated_at FROM events WHERE id = ?').bind('e1').first<any>()
  expect(row.name).toBe('New'); expect(row.updated_at).not.toBe('old')
})

test('DELETE /api/events/:id removes it', async () => {
  const cookie = await adminCookie()
  await env.DB.prepare(`INSERT INTO events (id,name,date,category,created_at,updated_at) VALUES ('e1','X','d','c','c','u')`).run()
  const res = await app.request('/api/events/e1', { method: 'DELETE', headers: { cookie } }, env)
  expect(res.status).toBe(200)
  expect((await env.DB.prepare('SELECT COUNT(*) AS n FROM events').first<any>()).n).toBe(0)
})
