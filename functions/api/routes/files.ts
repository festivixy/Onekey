import { Hono } from 'hono'
import type { Bindings } from '../app'

export const fileRoutes = new Hono<{ Bindings: Bindings }>()

fileRoutes.get('/files/:key{.+}', async (c) => {
  const key = c.req.param('key')
  const obj = await c.env.BUCKET.get(key)
  if (!obj) return c.json({ success: false, error: 'Not found' }, 404)
  return c.body(obj.body, 200, {
    'content-type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
    'cache-control': 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
  })
})
