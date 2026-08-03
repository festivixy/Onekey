import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import app from '../app'
import { hashPassword } from '../lib/password'
import { ensureSchema } from '../../../test/apply-migrations'

beforeAll(async () => { await ensureSchema() })

beforeEach(async () => {
  await env.DB.exec('DELETE FROM users')
  const hash = await hashPassword('pw12345')
  await env.DB.prepare(
    `INSERT INTO users (id, username, email, password_hash, role, is_active, created_at)
     VALUES (?,?,?,?,?,1,?)`,
  ).bind('u1', 'curt', 'iscurt.w@gmail.com', hash, 'super_admin', '2020-01-01T00:00:00.000Z').run()
})

test('login by email succeeds and sets an httpOnly cookie', async () => {
  const res = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'iscurt.w@gmail.com', password: 'pw12345' }),
  }, env)
  expect(res.status).toBe(200)
  const body = await res.json() as any
  expect(body.success).toBe(true)
  expect(body.data.user.role).toBe('super_admin')
  expect(body.data.user).not.toHaveProperty('password_hash')
  expect(res.headers.get('set-cookie')).toContain('HttpOnly')
})

test('login by username succeeds', async () => {
  const res = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'curt', password: 'pw12345' }),
  }, env)
  expect((await res.json() as any).data.user.email).toBe('iscurt.w@gmail.com')
})

test('wrong password is rejected with 401 and a generic message', async () => {
  const res = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'curt', password: 'nope' }),
  }, env)
  expect(res.status).toBe(401)
  expect((await res.json() as any).error).toMatch(/invalid/i)
})

test('/me returns the user when the cookie is present, 401 otherwise', async () => {
  const login = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'curt', password: 'pw12345' }),
  }, env)
  const cookie = login.headers.get('set-cookie')!
  const me = await app.request('/api/me', { headers: { cookie } }, env)
  expect((await me.json() as any).data.user.username).toBe('curt')
  const anon = await app.request('/api/me', {}, env)
  expect(anon.status).toBe(401)
})

test('login with a malformed JSON body returns a 400 JSON envelope, not a plain 500', async () => {
  const res = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: '{bad',
  }, env)
  expect(res.status).toBe(400)
  const body = await res.json() as any
  expect(body.success).toBe(false)
})

test('login with a JSON `null` body returns a 400 JSON envelope, not a plain 500', async () => {
  const res = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: 'null',
  }, env)
  expect(res.status).toBe(400)
  const body = await res.json() as any
  expect(body.success).toBe(false)
})

test('logout clears the session cookie', async () => {
  const login = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'curt', password: 'pw12345' }),
  }, env)
  const cookie = login.headers.get('set-cookie')!
  const res = await app.request('/api/logout', { method: 'POST', headers: { cookie } }, env)
  expect(res.status).toBe(200)
  const setCookie = res.headers.get('set-cookie')!
  expect(setCookie).toContain('onekey_session=')
  expect(setCookie).toContain('Max-Age=0')
})

test('change-password without a cookie is rejected with 401', async () => {
  const res = await app.request('/api/change-password', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'pw12345', newPassword: 'newpw123' }),
  }, env)
  expect(res.status).toBe(401)
})

test('change-password with the wrong current password is rejected', async () => {
  const login = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'curt', password: 'pw12345' }),
  }, env)
  const cookie = login.headers.get('set-cookie')!
  const res = await app.request('/api/change-password', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ currentPassword: 'nope', newPassword: 'newpw123' }),
  }, env)
  expect(res.status).not.toBe(200)
  expect(res.status).toBe(400)
  expect((await res.json() as any).success).toBe(false)
})

test('change-password with a JSON `null` body returns a 4xx JSON envelope, not a plain 500', async () => {
  const login = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'curt', password: 'pw12345' }),
  }, env)
  const cookie = login.headers.get('set-cookie')!
  const res = await app.request('/api/change-password', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: 'null',
  }, env)
  expect(res.status).toBeGreaterThanOrEqual(400)
  expect(res.status).toBeLessThan(500)
  const body = await res.json() as any
  expect(body.success).toBe(false)
})

test('change-password with the correct current password rotates the password', async () => {
  const login = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'curt', password: 'pw12345' }),
  }, env)
  const cookie = login.headers.get('set-cookie')!
  const change = await app.request('/api/change-password', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ currentPassword: 'pw12345', newPassword: 'newpw123' }),
  }, env)
  expect(change.status).toBe(200)
  expect((await change.json() as any).success).toBe(true)

  const loginWithNew = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'curt', password: 'newpw123' }),
  }, env)
  expect(loginWithNew.status).toBe(200)

  const loginWithOld = await app.request('/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'curt', password: 'pw12345' }),
  }, env)
  expect(loginWithOld.status).toBe(401)
})
