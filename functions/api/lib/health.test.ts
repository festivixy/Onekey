import { env } from 'cloudflare:test'
import { beforeAll, expect, test } from 'vitest'
import app from '../app'
import { ensureSchema } from '../../../test/apply-migrations'

beforeAll(async () => { await ensureSchema() })

test('health returns ok and the DB is reachable', async () => {
  const res = await app.request('/api/health', {}, env)
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ success: true, data: { status: 'ok' } })

  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()
  expect(row?.n).toBe(0)
})
