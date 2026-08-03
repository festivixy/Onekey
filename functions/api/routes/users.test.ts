import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import app from '../app'
import { ensureSchema } from '../../../test/apply-migrations'
import { hashPassword } from '../lib/password'

beforeAll(async () => { await ensureSchema() })
beforeEach(async () => { await env.DB.exec('DELETE FROM users'); await env.DB.exec('DELETE FROM activity_logs') })

async function seedAdmin(id: string, email: string, role = 'admin') {
  await env.DB.prepare(`INSERT INTO users (id, username, email, password_hash, role, is_active, created_at) VALUES (?,?,?,?,?,1,'2020-01-01T00:00:00.000Z')`).bind(id, id, email, await hashPassword('pw'), role).run()
}
async function cookieFor(username: string): Promise<string> {
  const res = await app.request('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password: 'pw' }) }, env)
  return res.headers.get('set-cookie')!
}

test('GET /api/users lists users without password_hash', async () => {
  await seedAdmin('a1', 'a@x.com')
  const res = await app.request('/api/users', { headers: { cookie: await cookieFor('a1') } }, env)
  const body = await res.json() as any
  expect(body.data.users[0]).not.toHaveProperty('password_hash')
})

test('POST /api/users creates a user and can log in with it', async () => {
  await seedAdmin('a1', 'a@x.com')
  const cookie = await cookieFor('a1')
  const res = await app.request('/api/users', { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ username: 'newbie', email: 'n@x.com', role: 'user', password: 'secret1' }) }, env)
  expect(res.status).toBe(200)
  const login = await app.request('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'newbie', password: 'secret1' }) }, env)
  expect(login.status).toBe(200)
})

test('POST /api/users refuses super_admin for a non-owner email', async () => {
  await seedAdmin('a1', 'a@x.com')
  const res = await app.request('/api/users', { method: 'POST', headers: { 'content-type': 'application/json', cookie: await cookieFor('a1') }, body: JSON.stringify({ username: 'x', email: 'x@x.com', role: 'super_admin', password: 'secret1' }) }, env)
  expect(res.status).toBe(400)
})

test('POST /api/users returns a clean 409 on duplicate username/email', async () => {
  await seedAdmin('a1', 'a@x.com')
  const res = await app.request('/api/users', { method: 'POST', headers: { 'content-type': 'application/json', cookie: await cookieFor('a1') }, body: JSON.stringify({ username: 'a1', email: 'new@x.com', role: 'user', password: 'secret1' }) }, env)
  const body = await res.json() as any
  expect(res.status).toBe(409)
  expect(body.success).toBe(false)
})

test('POST /api/users refuses to create an account under the owner email', async () => {
  await seedAdmin('a1', 'a@x.com')
  const res = await app.request('/api/users', { method: 'POST', headers: { 'content-type': 'application/json', cookie: await cookieFor('a1') }, body: JSON.stringify({ username: 'x', email: 'iscurt.w@gmail.com', role: 'user', password: 'secret1' }) }, env)
  const body = await res.json() as any
  expect(res.status).toBe(400)
  expect(body.success).toBe(false)
})

test('PATCH refuses to modify the owner account', async () => {
  await seedAdmin('a1', 'a@x.com', 'admin')
  await seedAdmin('own', 'iscurt.w@gmail.com', 'super_admin')
  const res = await app.request('/api/users/own', { method: 'PATCH', headers: { 'content-type': 'application/json', cookie: await cookieFor('a1') }, body: JSON.stringify({ role: 'user' }) }, env)
  expect(res.status).toBe(400)
})

test('PATCH refuses self role change (no self-escalation)', async () => {
  await seedAdmin('a1', 'a@x.com', 'admin')
  const res = await app.request('/api/users/a1', { method: 'PATCH', headers: { 'content-type': 'application/json', cookie: await cookieFor('a1') }, body: JSON.stringify({ role: 'super_admin' }) }, env)
  expect(res.status).toBe(400)
})

test('PATCH refuses self isActive change (guard c, no role/super_admin involved)', async () => {
  await seedAdmin('a1', 'a@x.com', 'admin')
  const res = await app.request('/api/users/a1', { method: 'PATCH', headers: { 'content-type': 'application/json', cookie: await cookieFor('a1') }, body: JSON.stringify({ isActive: false }) }, env)
  const body = await res.json() as any
  expect(res.status).toBe(400)
  expect(body.success).toBe(false)
})

test('DELETE refuses to delete the owner', async () => {
  await seedAdmin('a1', 'a@x.com', 'admin')
  await seedAdmin('own', 'iscurt.w@gmail.com', 'super_admin')
  const res = await app.request('/api/users/own', { method: 'DELETE', headers: { cookie: await cookieFor('a1') } }, env)
  expect(res.status).toBe(400)
})

test('GET /api/users rejects a non-admin session', async () => {
  await seedAdmin('u1', 'u@x.com', 'user')
  const res = await app.request('/api/users', { headers: { cookie: await cookieFor('u1') } }, env)
  expect(res.status).toBe(403)
})
