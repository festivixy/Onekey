import { Hono } from 'hono'
import type { Bindings } from '../app'
import type { SessionUser } from '../lib/auth'
import { requireAdmin } from '../lib/auth'
import { serializeEvent, eventInputToColumns, type EventRow } from '../lib/serialize'
import { logActivity } from '../lib/activity'

export const eventRoutes = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()

eventRoutes.get('/events', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM events').all<EventRow>()
  return c.json({ success: true, data: { events: results.map(serializeEvent) } })
})

eventRoutes.post('/events', requireAdmin(), async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ success: false, error: 'Invalid request body' }, 400) }
  const cols = eventInputToColumns((body ?? {}) as Record<string, unknown>)
  if (!cols.name || !cols.date || !cols.category) return c.json({ success: false, error: 'name, date and category are required' }, 400)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const record: Record<string, unknown> = { id, ...cols, created_at: now, updated_at: now }
  const keys = Object.keys(record)
  await c.env.DB.prepare(`INSERT INTO events (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`)
    .bind(...keys.map((k) => record[k])).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'add_event', details: `Created event: ${cols.name}`, username: user.username })
  return c.json({ success: true, data: { id, message: 'Event created' } })
})

eventRoutes.patch('/events/:id', requireAdmin(), async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ success: false, error: 'Invalid request body' }, 400) }
  const cols = eventInputToColumns((body ?? {}) as Record<string, unknown>)
  cols.updated_at = new Date().toISOString()
  const keys = Object.keys(cols)
  await c.env.DB.prepare(`UPDATE events SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`)
    .bind(...keys.map((k) => cols[k]), c.req.param('id')).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'update_event', details: `Updated event ${c.req.param('id')}`, username: user.username })
  return c.json({ success: true, data: { message: 'Event updated' } })
})

eventRoutes.delete('/events/:id', requireAdmin(), async (c) => {
  await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(c.req.param('id')).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'delete_event', details: `Deleted event ${c.req.param('id')}`, username: user.username })
  return c.json({ success: true, data: { message: 'Event deleted' } })
})
