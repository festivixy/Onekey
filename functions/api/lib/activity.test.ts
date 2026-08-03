import { env } from 'cloudflare:test'
import { beforeAll, beforeEach, expect, test } from 'vitest'
import { logActivity } from './activity'
import { ensureSchema } from '../../../test/apply-migrations'

beforeAll(async () => { await ensureSchema() })
beforeEach(async () => { await env.DB.exec('DELETE FROM activity_logs') })

test('logActivity inserts a row with the given fields', async () => {
  await logActivity(env.DB, { userId: 'u1', action: 'add_event', details: 'Created X', username: 'curt' })
  const row = await env.DB.prepare('SELECT * FROM activity_logs').first<any>()
  expect(row.user_id).toBe('u1')
  expect(row.action).toBe('add_event')
  expect(row.details).toBe('Created X')
  expect(row.username).toBe('curt')
  expect(typeof row.id).toBe('string')
  expect(typeof row.timestamp).toBe('string')
})

test('logActivity never throws even if the insert fails', async () => {
  // pass a bogus binding object whose prepare throws; must resolve, not reject
  const brokenDb = { prepare() { throw new Error('boom') } } as unknown as D1Database
  await expect(logActivity(brokenDb, { userId: 'u1', action: 'x', details: 'y' })).resolves.toBeUndefined()
})
