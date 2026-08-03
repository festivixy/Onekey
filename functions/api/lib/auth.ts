import type { Context, MiddlewareHandler } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'

export type SessionUser = { id: string; email: string; username: string; role: string }
const COOKIE = 'onekey_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function issueSession(c: Context, user: SessionUser): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE
  const token = await sign({ ...user, exp }, c.env.JWT_SECRET)
  setCookie(c, COOKIE, token, {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: MAX_AGE,
  })
}

export async function readSession(c: Context): Promise<SessionUser | null> {
  const token = getCookie(c, COOKIE)
  if (!token) return null
  try {
    const p = await verify(token, c.env.JWT_SECRET, 'HS256')
    return { id: p.id as string, email: p.email as string, username: p.username as string, role: p.role as string }
  } catch {
    return null
  }
}

export function clearSession(c: Context): void {
  deleteCookie(c, COOKIE, { path: '/' })
}

export function requireAdmin(): MiddlewareHandler {
  return async (c, next) => {
    const session = await readSession(c)
    if (!session) return c.json({ success: false, error: 'Not authenticated' }, 401)

    const row = await c.env.DB.prepare('SELECT role, is_active FROM users WHERE id = ?')
      .bind(session.id).first<{ role: string; is_active: number }>()
    if (!row || row.is_active !== 1) return c.json({ success: false, error: 'Forbidden' }, 403)
    if (row.role !== 'admin' && row.role !== 'super_admin') {
      return c.json({ success: false, error: 'Forbidden' }, 403)
    }

    c.set('user', { ...session, role: row.role })
    await next()
  }
}
