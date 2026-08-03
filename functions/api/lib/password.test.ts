import { expect, test } from 'vitest'
import { hashPassword, verifyPassword } from './password'

test('hash is salted: same password hashes differently', async () => {
  const a = await hashPassword('hunter2')
  const b = await hashPassword('hunter2')
  expect(a).not.toBe(b)
  expect(a).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/)
})

test('verify accepts the correct password and rejects wrong ones', async () => {
  const stored = await hashPassword('hunter2')
  expect(await verifyPassword('hunter2', stored)).toBe(true)
  expect(await verifyPassword('wrong', stored)).toBe(false)
})
