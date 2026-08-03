import { Hono } from 'hono'
import type { Bindings } from '../app'
import type { SessionUser } from '../lib/auth'
import { requireAdmin } from '../lib/auth'
import { serializeTeamMember, teamInputToColumns, type TeamRow } from '../lib/serialize'
import { logActivity } from '../lib/activity'

export const teamRoutes = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()

teamRoutes.get('/team', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM team_members').all<TeamRow>()
  return c.json({ success: true, data: { members: results.map(serializeTeamMember) } })
})

teamRoutes.post('/team', requireAdmin(), async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ success: false, error: 'Invalid request body' }, 400) }
  const cols = teamInputToColumns((body ?? {}) as Record<string, unknown>)
  if (!cols.name) return c.json({ success: false, error: 'name is required' }, 400)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const record: Record<string, unknown> = { id, sections: '[]', is_active: 1, created_at: now, updated_at: now, ...cols }
  const keys = Object.keys(record)
  await c.env.DB.prepare(`INSERT INTO team_members (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`)
    .bind(...keys.map((k) => record[k])).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'add_member', details: `Added member: ${record.name ?? id}`, username: user.username })
  return c.json({ success: true, data: { id } })
})

teamRoutes.patch('/team/:id', requireAdmin(), async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ success: false, error: 'Invalid request body' }, 400) }
  const cols = teamInputToColumns((body ?? {}) as Record<string, unknown>)
  cols.updated_at = new Date().toISOString()
  const keys = Object.keys(cols)
  if (keys.length === 0) return c.json({ success: false, error: 'No fields to update' }, 400)
  await c.env.DB.prepare(`UPDATE team_members SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`)
    .bind(...keys.map((k) => cols[k]), c.req.param('id')).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'update_member', details: `Updated member ${c.req.param('id')}`, username: user.username })
  return c.json({ success: true, data: { message: 'Updated' } })
})

teamRoutes.delete('/team/:id', requireAdmin(), async (c) => {
  await c.env.DB.prepare('DELETE FROM team_members WHERE id = ?').bind(c.req.param('id')).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'delete_member', details: `Deleted member ${c.req.param('id')}`, username: user.username })
  return c.json({ success: true, data: { message: 'Deleted' } })
})
