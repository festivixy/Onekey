import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import app from '../app'
import { ensureSchema } from '../../../test/apply-migrations'

beforeAll(async () => { await ensureSchema() })
beforeEach(async () => { await env.DB.exec('DELETE FROM team_members'); await env.DB.exec('DELETE FROM users'); await env.DB.exec('DELETE FROM activity_logs') })

async function adminCookie(): Promise<string> {
  await env.DB.prepare(`INSERT INTO users (id, username, email, password_hash, role, is_active, created_at) VALUES ('a1','admin','a@x.com','x:y','admin',1,'2020-01-01T00:00:00.000Z')`).run()
  const { hashPassword } = await import('../lib/password')
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword('pw'), 'a1').run()
  const res = await app.request('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'pw' }) }, env)
  return res.headers.get('set-cookie')!
}

test('GET /api/team is public and returns serialized members', async () => {
  await env.DB.prepare(`INSERT INTO team_members (id,name,role,sections,is_active,created_at,updated_at) VALUES ('t1','A','r','["founders"]',1,'c','u')`).run()
  const res = await app.request('/api/team', {}, env)
  const body = await res.json() as any
  expect(res.status).toBe(200)
  expect(body.data.members[0]).toMatchObject({ id: 't1', name: 'A', sections: ['founders'], isActive: true })
})

test('POST /api/team requires admin', async () => {
  const anon = await app.request('/api/team', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'X' }) }, env)
  expect(anon.status).toBe(401)
})

test('POST /api/team creates a member and logs the action', async () => {
  const cookie = await adminCookie()
  const res = await app.request('/api/team', { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ name: 'New', sections: ['leadership'], group: 'onekey', isActive: true }) }, env)
  const body = await res.json() as any
  expect(res.status).toBe(200)
  expect(typeof body.data.id).toBe('string')
  const row = await env.DB.prepare('SELECT * FROM team_members WHERE id = ?').bind(body.data.id).first<any>()
  expect(row.name).toBe('New'); expect(row.group_name).toBe('onekey'); expect(row.sections).toBe('["leadership"]')
  const log = await env.DB.prepare('SELECT * FROM activity_logs').first<any>()
  expect(log.action).toBe('add_member')
})

test('POST /api/team without name returns a clean 400', async () => {
  const cookie = await adminCookie()
  const res = await app.request('/api/team', { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ sections: ['leadership'] }) }, env)
  expect(res.status).toBe(400)
  const body = await res.json() as any
  expect(body.success).toBe(false)
})

test('PATCH /api/team/:id updates provided fields only', async () => {
  const cookie = await adminCookie()
  await env.DB.prepare(`INSERT INTO team_members (id,name,role,sections,is_active,created_at,updated_at) VALUES ('t1','A','r','[]',1,'c','u')`).run()
  const res = await app.request('/api/team/t1', { method: 'PATCH', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ role: 'Manager', isActive: false }) }, env)
  expect(res.status).toBe(200)
  const row = await env.DB.prepare('SELECT role, is_active, name FROM team_members WHERE id = ?').bind('t1').first<any>()
  expect(row.role).toBe('Manager'); expect(row.is_active).toBe(0); expect(row.name).toBe('A')
})

test('DELETE /api/team/:id removes the member', async () => {
  const cookie = await adminCookie()
  await env.DB.prepare(`INSERT INTO team_members (id,name,role,sections,is_active,created_at,updated_at) VALUES ('t1','A','r','[]',1,'c','u')`).run()
  const res = await app.request('/api/team/t1', { method: 'DELETE', headers: { cookie } }, env)
  expect(res.status).toBe(200)
  expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM team_members').first<any>()).toMatchObject({ n: 0 })
})
