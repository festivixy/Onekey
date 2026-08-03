import { Hono } from 'hono'
import type { Bindings } from '../app'
import type { SessionUser } from '../lib/auth'
import { requireAdmin } from '../lib/auth'
import { validateImage, buildKey } from '../lib/r2'
import { logActivity } from '../lib/activity'

export const uploadRoutes = new Hono<{ Bindings: Bindings; Variables: { user: SessionUser } }>()

uploadRoutes.post('/uploads', requireAdmin(), async (c) => {
  const form = await c.req.parseBody()
  const file = form['file']
  if (!(file instanceof File)) return c.json({ success: false, error: 'file is required' }, 400)
  const invalid = validateImage(file)
  if (invalid) return c.json({ success: false, error: invalid }, 400)

  const key = buildKey('team', file.name)
  await c.env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })
  const user = c.get('user')
  await logActivity(c.env.DB, { userId: user.id, action: 'upload_image', details: `Uploaded image ${file.name}`, username: user.username })

  return c.json({
    success: true,
    data: { filePath: `/api/files/${key}`, filename: key.split('/').pop() ?? key, originalName: file.name, size: file.size },
  })
})
