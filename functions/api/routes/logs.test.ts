import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import app from '../app'
import { ensureSchema } from '../../../test/apply-migrations'
import { hashPassword } from '../lib/password'

beforeAll(async () => { await ensureSchema() })
beforeEach(async () => { await env.DB.exec('DELETE FROM activity_logs'); await env.DB.exec('DELETE FROM users') })

async function adminCookie(): Promise<string> {
  await env.DB.prepare(`INSERT INTO users (id, username, email, password_hash, role, is_active, created_at) VALUES ('a1','admin','a@x.com',?,'admin',1,'2020-01-01T00:00:00.000Z')`).bind(await hashPassword('pw')).run()
  const res = await app.request('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'pw' }) }, env)
  return res.headers.get('set-cookie')!
}

test('GET /api/logs requires admin', async () => {
  expect((await app.request('/api/logs', {}, env)).status).toBe(401)
})

test('GET /api/logs returns logs newest-first with pagination', async () => {
  const cookie = await adminCookie()
  await env.DB.prepare(`INSERT INTO activity_logs (id,user_id,action,details,username,timestamp) VALUES ('l1','a1','add_event','a','admin','2024-01-01T00:00:00Z')`).run()
  await env.DB.prepare(`INSERT INTO activity_logs (id,user_id,action,details,username,timestamp) VALUES ('l2','a1','update_event','b','admin','2024-02-01T00:00:00Z')`).run()
  const res = await app.request('/api/logs', { headers: { cookie } }, env)
  const body = await res.json() as any
  expect(body.data.logs.map((l: any) => l.id)).toEqual(['l2', 'l1'])
  expect(body.data.pagination).toMatchObject({ page: 1, total: 2 })
  expect(body.data.logs[0]).toMatchObject({ user_id: 'a1', action: 'update_event' })
})

test('GET /api/logs filters by action', async () => {
  const cookie = await adminCookie()
  await env.DB.prepare(`INSERT INTO activity_logs (id,user_id,action,details,username,timestamp) VALUES ('l1','a1','add_event','a','admin','2024-01-01T00:00:00Z')`).run()
  await env.DB.prepare(`INSERT INTO activity_logs (id,user_id,action,details,username,timestamp) VALUES ('l2','a1','remove_user','b','admin','2024-02-01T00:00:00Z')`).run()
  const res = await app.request('/api/logs?action=remove_user', { headers: { cookie } }, env)
  const body = await res.json() as any
  expect(body.data.logs.map((l: any) => l.id)).toEqual(['l2'])
})
