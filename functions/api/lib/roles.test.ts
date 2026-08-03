import { expect, test } from 'vitest'
import { roleForEmail, OWNER_EMAIL } from './roles'

test('owner email resolves to super_admin', () => {
  expect(roleForEmail(OWNER_EMAIL)).toBe('super_admin')
})
test('allowlisted emails resolve to admin', () => {
  expect(roleForEmail('on3keymusic@gmail.com')).toBe('admin')
  expect(roleForEmail('vanstringscm@gmail.com')).toBe('admin')
})
test('everyone else resolves to user', () => {
  expect(roleForEmail('someone@else.com')).toBe('user')
})
