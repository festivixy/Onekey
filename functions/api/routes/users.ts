import { Hono } from 'hono'
import type { Bindings } from '../app'
import type { SessionUser } from '../lib/auth'
import { requireAdmin } from '../lib/auth'
import { serializeUser, type UserRow } from '../lib/serialize'
import { hashPassword } from '../lib/password'
import { OWNER_EMAIL } from '../lib/roles'
import { logActivity } from '../lib/activity'

export const userRoutes = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()

userRoutes.get('/users', requireAdmin(), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM users').all<UserRow>()
  return c.json({ success: true, data: { users: results.map(serializeUser) } })
})

userRoutes.post('/users', requireAdmin(), async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ success: false, error: 'Invalid request body' }, 400) }
  const b = (body ?? {}) as Record<string, unknown>
  const username = typeof b.username === 'string' ? b.username : ''
  const email = typeof b.email === 'string' ? b.email : ''
  const password = typeof b.password === 'string' ? b.password : ''
  const role = typeof b.role === 'string' ? b.role : 'user'
  if (!username || !email || !password) return c.json({ success: false, error: 'username, email and password are required' }, 400)
  if (email === OWNER_EMAIL) return c.json({ success: false, error: 'The owner account cannot be created here.' }, 400)
  if (role === 'super_admin' && email !== OWNER_EMAIL) return c.json({ success: false, error: 'Only the owner account can hold the super_admin role.' }, 400)
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ? OR email = ?').bind(username, email).first()
  if (existing) return c.json({ success: false, error: 'A user with that username or email already exists.' }, 409)
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    `INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, is_active, created_at)
     VALUES (?,?,?,?,?,?,?,1,?)`,
  ).bind(id, username, email, await hashPassword(password),
    typeof b.firstName === 'string' ? b.firstName : null,
    typeof b.lastName === 'string' ? b.lastName : null,
    role, new Date().toISOString()).run()
  const actor = c.get('user')
  await logActivity(c.env.DB, { userId: actor.id, action: 'add_user', details: `Created user: ${username}`, username: actor.username })
  return c.json({ success: true, data: { userId: id, message: 'User created' } })
})

userRoutes.patch('/users/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id')
  const actor = c.get('user')
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ success: false, error: 'Invalid request body' }, 400) }
  const b = (body ?? {}) as Record<string, unknown>
  const target = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(id).first<{ email: string }>()
  if (!target) return c.json({ success: false, error: 'User not found' }, 404)
  const changingRoleOrActive = b.role !== undefined || b.isActive !== undefined
  if (target.email === OWNER_EMAIL && changingRoleOrActive) return c.json({ success: false, error: 'The owner account cannot be modified.' }, 400)
  if (b.role === 'super_admin' && target.email !== OWNER_EMAIL) return c.json({ success: false, error: 'Only the owner account can hold the super_admin role.' }, 400)
  if (id === actor.id && changingRoleOrActive) return c.json({ success: false, error: 'You cannot change your own role or status.' }, 400)

  const cols: Record<string, unknown> = {}
  if (typeof b.firstName === 'string') cols.first_name = b.firstName
  if (typeof b.lastName === 'string') cols.last_name = b.lastName
  if (typeof b.role === 'string') cols.role = b.role
  if (typeof b.isActive === 'boolean') cols.is_active = b.isActive ? 1 : 0
  const keys = Object.keys(cols)
  if (keys.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400)
  await c.env.DB.prepare(`UPDATE users SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`)
    .bind(...keys.map((k) => cols[k]), id).run()
  await logActivity(c.env.DB, { userId: actor.id, action: 'update_user', details: `Updated user ${id}`, username: actor.username })
  return c.json({ success: true, data: { message: 'User updated' } })
})

userRoutes.delete('/users/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id')
  const target = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(id).first<{ email: string }>()
  if (target?.email === OWNER_EMAIL) return c.json({ success: false, error: 'The owner account cannot be deleted.' }, 400)
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  const actor = c.get('user')
  await logActivity(c.env.DB, { userId: actor.id, action: 'remove_user', details: `Deleted user ${id}`, username: actor.username })
  return c.json({ success: true, data: { message: 'User deleted' } })
})
