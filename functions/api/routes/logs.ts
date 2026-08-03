import { Hono } from 'hono'
import type { Bindings } from '../app'
import type { SessionUser } from '../lib/auth'
import { requireAdmin } from '../lib/auth'
import { serializeLog, type LogRow } from '../lib/serialize'

export const logRoutes = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()

logRoutes.get('/logs', requireAdmin(), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10) || 1)
  const limit = Math.max(1, parseInt(c.req.query('limit') ?? '100', 10) || 100)
  const action = c.req.query('action') ?? 'all'

  const stmt = action === 'all'
    ? c.env.DB.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500')
    : c.env.DB.prepare('SELECT * FROM activity_logs WHERE action = ? ORDER BY timestamp DESC LIMIT 500').bind(action)
  const { results } = await stmt.all<LogRow>()

  const total = results.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const logs = results.slice(start, start + limit).map(serializeLog)
  return c.json({ success: true, data: { logs, pagination: { page, limit, total, totalPages } } })
})
