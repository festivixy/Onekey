import { Hono } from 'hono'
import type { Bindings } from '../app'
import { verifyPassword, hashPassword } from '../lib/password'
import { issueSession, readSession, clearSession, type SessionUser } from '../lib/auth'
import { serializeUser, type UserRow } from '../lib/serialize'

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()

// Well-formed dummy hash (32-hex salt : 64-hex hash) so verifyPassword runs the full PBKDF2
// derive even when no user row was found, keeping login timing uniform (avoids user enumeration).
const TIMING_DUMMY_HASH = 'a'.repeat(32) + ':' + 'b'.repeat(64)

authRoutes.post('/login', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: 'Invalid request body' }, 400)
  }
  const b = (body ?? {}) as Record<string, unknown>
  const username = typeof b.username === 'string' ? b.username : ''
  const password = typeof b.password === 'string' ? b.password : ''
  if (!username || !password) return c.json({ success: false, error: 'Missing credentials' }, 400)

  const col = username.includes('@') ? 'email' : 'username'
  const row = await c.env.DB.prepare(`SELECT * FROM users WHERE ${col} = ?`).bind(username.trim()).first<UserRow>()
  if (!row) {
    await verifyPassword(password, TIMING_DUMMY_HASH)
    return c.json({ success: false, error: 'Invalid email or password.' }, 401)
  }
  if (!(await verifyPassword(password, row.password_hash))) {
    return c.json({ success: false, error: 'Invalid email or password.' }, 401)
  }

  const user = serializeUser(row)
  await issueSession(c, { id: user.id, email: user.email, username: user.username, role: user.role })
  await c.env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), user.id).run()
  return c.json({ success: true, data: { user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } } })
})

authRoutes.get('/me', async (c) => {
  const session = await readSession(c)
  if (!session) return c.json({ success: false, error: 'Not authenticated' }, 401)
  const row = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.id).first<UserRow>()
  if (!row) return c.json({ success: false, error: 'Not authenticated' }, 401)
  return c.json({ success: true, data: { user: serializeUser(row) } })
})

authRoutes.post('/logout', (c) => {
  clearSession(c)
  return c.json({ success: true, data: { message: 'Logged out' } })
})

authRoutes.post('/change-password', async (c) => {
  const session = await readSession(c)
  if (!session) return c.json({ success: false, error: 'Not authenticated' }, 401)
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: 'Invalid request body' }, 400)
  }
  const b = (body ?? {}) as Record<string, unknown>
  const currentPassword = typeof b.currentPassword === 'string' ? b.currentPassword : ''
  const newPassword = typeof b.newPassword === 'string' ? b.newPassword : ''
  if (!currentPassword || !newPassword) return c.json({ success: false, error: 'Missing fields' }, 400)
  const row = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.id).first<UserRow>()
  if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
    return c.json({ success: false, error: 'Current password is incorrect' }, 400)
  }
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(await hashPassword(newPassword), session.id).run()
  return c.json({ success: true, data: { message: 'Password changed' } })
})
