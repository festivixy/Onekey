import { Hono } from 'hono'
import type { Bindings } from '../app'
import type { SessionUser } from '../lib/auth'
import { requireAdmin } from '../lib/auth'
import { logActivity } from '../lib/activity'

const KEY = 'vanstring_sections'
export const vanstringRoutes = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()

vanstringRoutes.get('/vanstring', async (c) => {
  const row = await c.env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(KEY).first<{ value: string }>()
  let groups: unknown[] = []
  if (row) { try { const p = JSON.parse(row.value); if (Array.isArray(p)) groups = p } catch { groups = [] } }
  return c.json({ success: true, data: { groups } })
})

vanstringRoutes.put('/vanstring', requireAdmin(), async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ success: false, error: 'Invalid request body' }, 400) }
  const groups = (body as { groups?: unknown })?.groups
  if (!Array.isArray(groups)) return c.json({ success: false, error: 'groups must be an array' }, 400)
  await c.env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(KEY, JSON.stringify(groups)).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'update_vanstring', details: 'Updated Vanstring roster', username: user.username })
  return c.json({ success: true, data: null })
})
