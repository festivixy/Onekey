import { Hono } from 'hono'
import type { Bindings } from '../app'
import type { SessionUser } from '../lib/auth'
import { requireAdmin } from '../lib/auth'
import { serializePhoto, type PhotoRow } from '../lib/serialize'
import { validateImage, buildKey } from '../lib/r2'
import { logActivity } from '../lib/activity'

export const photoRoutes = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()

photoRoutes.get('/photos', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM photos ORDER BY uploaded_at DESC').all<PhotoRow>()
  return c.json({ success: true, data: { photos: results.map(serializePhoto) } })
})

photoRoutes.post('/photos', requireAdmin(), async (c) => {
  const form = await c.req.parseBody()
  const file = form['file']
  const category = typeof form['category'] === 'string' ? form['category'] : ''
  if (!(file instanceof File)) return c.json({ success: false, error: 'file is required' }, 400)
  const invalid = validateImage(file)
  if (invalid) return c.json({ success: false, error: invalid }, 400)
  if (!category) return c.json({ success: false, error: 'category is required' }, 400)

  const key = buildKey(`photos/${category.replace(/[^a-zA-Z0-9._-]/g, '_')}`, file.name)
  await c.env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const url = `/api/files/${key}`
  await c.env.DB.prepare(
    `INSERT INTO photos (id, url, r2_key, category, filename, uploaded_at) VALUES (?,?,?,?,?,?)`,
  ).bind(id, url, key, category, file.name, now).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'add_photo', details: `Uploaded photo (${category})`, username: user.username })

  const row: PhotoRow = { id, url, r2_key: key, category, filename: file.name, uploaded_at: now }
  return c.json({ success: true, data: serializePhoto(row) })
})

photoRoutes.patch('/photos/:id', requireAdmin(), async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ success: false, error: 'Invalid request body' }, 400) }
  const category = (body as { category?: unknown })?.category
  if (typeof category !== 'string' || !category) return c.json({ success: false, error: 'category is required' }, 400)
  await c.env.DB.prepare('UPDATE photos SET category = ? WHERE id = ?').bind(category, c.req.param('id')).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'update_photo', details: `Recategorized photo ${c.req.param('id')} → ${category}`, username: user.username })
  return c.json({ success: true, data: null })
})

photoRoutes.delete('/photos/:id', requireAdmin(), async (c) => {
  const row = await c.env.DB.prepare('SELECT r2_key FROM photos WHERE id = ?').bind(c.req.param('id')).first<{ r2_key: string }>()
  if (row?.r2_key) {
    try { await c.env.BUCKET.delete(row.r2_key) } catch { /* object may already be gone — proceed */ }
  }
  await c.env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(c.req.param('id')).run()
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'delete_photo', details: `Deleted photo ${c.req.param('id')}`, username: user.username })
  return c.json({ success: true, data: null })
})
