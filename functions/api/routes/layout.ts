import { Hono } from 'hono'
import type { Bindings } from '../app'
import type { SessionUser } from '../lib/auth'
import { requireAdmin } from '../lib/auth'
import { logActivity } from '../lib/activity'

const KEY = 'team_layout'
export const layoutRoutes = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()

layoutRoutes.get('/team-layout', async (c) => {
  const row = await c.env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(KEY).first<{ value: string }>()
  let layout: unknown = null
  if (row) { try { layout = JSON.parse(row.value) } catch { layout = null } }
  return c.json({ success: true, data: { layout } })
})

layoutRoutes.put('/team-layout', requireAdmin(), async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ success: false, error: 'Invalid request body' }, 400) }
  const layout = (body as { layout?: unknown })?.layout
  if (layout === null || typeof layout !== 'object' || Array.isArray(layout)) {
    return c.json({ success: false, error: 'layout must be an object' }, 400)
  }
  await c.env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(KEY, JSON.stringify(layout)).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'update_team_layout', details: 'Updated team page layout', username: user.username })
  return c.json({ success: true, data: null })
})
