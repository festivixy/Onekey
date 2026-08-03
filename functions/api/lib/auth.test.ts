import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import { Hono } from 'hono'
import { issueSession, readSession, clearSession, requireAdmin, type SessionUser } from './auth'
import type { Bindings } from '../app'
import { ensureSchema } from '../../../test/apply-migrations'

const admin: SessionUser = { id: 'u1', email: 'u1@x.com', username: 'u1', role: 'admin' }
const member: SessionUser = { id: 'u2', email: 'm@b.c', username: 'm', role: 'user' }

function testApp() {
  const app = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()
  app.post('/login', async (c) => { await issueSession(c, admin); return c.json({ ok: true }) })
  app.post('/login-user', async (c) => { await issueSession(c, member); return c.json({ ok: true }) })
  app.get('/whoami', async (c) => c.json({ user: await readSession(c) }))
  app.post('/logout', (c) => { clearSession(c); return c.json({ ok: true }) })
  app.get('/admin-only', requireAdmin(), (c) => c.json({ user: c.get('user') }))
  return app
}

beforeAll(async () => { await ensureSchema() })
beforeEach(async () => { await env.DB.exec('DELETE FROM users') })

async function seedUser(id: string, role: string, isActive = 1) {
  await env.DB.prepare(
    `INSERT INTO users (id, username, email, password_hash, role, is_active, created_at)
     VALUES (?,?,?,?,?,?,?)`,
  ).bind(id, id, `${id}@x.com`, 'x:y', role, isActive, '2020-01-01T00:00:00.000Z').run()
}

test('issued cookie round-trips through readSession', async () => {
  const app = testApp()
  const login = await app.request('/login', { method: 'POST' }, env)
  const cookie = login.headers.get('set-cookie')!
  expect(cookie).toContain('HttpOnly')
  expect(cookie).toContain('Secure')
  expect(cookie).toContain('SameSite=Lax')
  expect(cookie).toContain('Path=/')
  expect(cookie).toContain('Max-Age=604800')
  const who = await app.request('/whoami', { headers: { cookie } }, env)
  expect((await who.json() as any).user.id).toBe('u1')
})

test('requireAdmin blocks anonymous with 401', async () => {
  const res = await testApp().request('/admin-only', {}, env)
  expect(res.status).toBe(401)
})

test('requireAdmin allows an admin whose DB row is active', async () => {
  await seedUser('u1', 'admin')
  const app = testApp() // logs in as { id:'u1', role:'admin' }
  const cookie = (await app.request('/login', { method: 'POST' }, env)).headers.get('set-cookie')!
  const res = await app.request('/admin-only', { headers: { cookie } }, env)
  expect(res.status).toBe(200)
})

test('requireAdmin denies a session whose DB role was demoted to user', async () => {
  await seedUser('u1', 'user') // DB says user even though the cookie said admin
  const app = testApp()
  const cookie = (await app.request('/login', { method: 'POST' }, env)).headers.get('set-cookie')!
  expect((await app.request('/admin-only', { headers: { cookie } }, env)).status).toBe(403)
})

test('requireAdmin denies a deactivated admin', async () => {
  await seedUser('u1', 'admin', 0)
  const app = testApp()
  const cookie = (await app.request('/login', { method: 'POST' }, env)).headers.get('set-cookie')!
  expect((await app.request('/admin-only', { headers: { cookie } }, env)).status).toBe(403)
})

test('requireAdmin denies when the user row is gone', async () => {
  const app = testApp() // no seedUser → no row for u1
  const cookie = (await app.request('/login', { method: 'POST' }, env)).headers.get('set-cookie')!
  expect((await app.request('/admin-only', { headers: { cookie } }, env)).status).toBe(403)
})

test('requireAdmin blocks a non-admin session with 403', async () => {
  await seedUser('u2', 'user')
  const app = testApp()
  const cookie = (await app.request('/login-user', { method: 'POST' }, env)).headers.get('set-cookie')!
  const res = await app.request('/admin-only', { headers: { cookie } }, env)
  expect(res.status).toBe(403)
})
