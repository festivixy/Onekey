import { expect, test } from 'vitest'
import { serializeUser, type UserRow, serializeEvent, serializeTeamMember, serializePhoto, serializeLog, teamInputToColumns, eventInputToColumns } from './serialize'

const row: UserRow = {
  id: 'u1', username: 'curt', email: 'c@x.com', password_hash: 'salt:hash',
  first_name: 'Curt', last_name: 'Sun', role: 'super_admin',
  is_active: 1, created_at: '2020-01-01T00:00:00.000Z', last_login_at: '2021-06-15T12:00:00.000Z',
}

test('serializeUser maps to camelCase and drops the hash', () => {
  const out = serializeUser(row)
  expect(out).toEqual({
    id: 'u1', username: 'curt', email: 'c@x.com',
    firstName: 'Curt', lastName: 'Sun', role: 'super_admin',
    isActive: true, createdAt: '2020-01-01T00:00:00.000Z', lastLoginAt: '2021-06-15T12:00:00.000Z',
  })
  expect('password_hash' in out).toBe(false)
})

test('serializeTeamMember maps columns, parses sections, drops nulls', () => {
  const out = serializeTeamMember({
    id: 't1', name: 'A', role: 'r', school: 's', bio: 'b', instagram: 'i', image: 'im',
    sections: '["founders","leadership"]', group_name: 'onekey', concertmaster_type: null,
    is_active: 1, created_at: 'c', updated_at: 'u',
  })
  expect(out).toEqual({
    id: 't1', name: 'A', role: 'r', school: 's', bio: 'b', instagram: 'i', image: 'im',
    sections: ['founders', 'leadership'], group: 'onekey', concertmasterType: undefined,
    isActive: true, createdAt: 'c', updatedAt: 'u',
  })
})

test('serializeEvent turns null optionals into undefined', () => {
  const out = serializeEvent({
    id: 'e1', name: 'N', date: 'd', category: 'cat',
    location: null, time: null, attendees: null, performers: null, duration: null,
    description: null, photo_url: null, created_at: 'c', updated_at: 'u',
  })
  expect(out).toEqual({ id: 'e1', name: 'N', date: 'd', category: 'cat', location: undefined, time: undefined, attendees: undefined, performers: undefined, duration: undefined, description: undefined, photo_url: undefined, created_at: 'c', updated_at: 'u' })
})

test('serializePhoto maps r2_key→storagePath and uploaded_at→uploadedAt', () => {
  expect(serializePhoto({ id: 'p1', url: 'U', r2_key: 'photos/onekey/x.jpg', category: 'onekey', filename: 'x.jpg', uploaded_at: 'c' }))
    .toEqual({ id: 'p1', url: 'U', storagePath: 'photos/onekey/x.jpg', category: 'onekey', filename: 'x.jpg', uploadedAt: 'c' })
})

test('serializeLog passes through snake_case', () => {
  expect(serializeLog({ id: 'l1', user_id: 'u1', action: 'a', details: 'd', username: 'n', timestamp: 't' }))
    .toEqual({ id: 'l1', user_id: 'u1', action: 'a', details: 'd', username: 'n', timestamp: 't' })
})

test('teamInputToColumns maps camelCase and omits absent keys', () => {
  expect(teamInputToColumns({ name: 'A', isActive: false, group: 'vanstring', sections: ['founders'] }))
    .toEqual({ name: 'A', is_active: 0, group_name: 'vanstring', sections: '["founders"]' })
})

test('eventInputToColumns keeps only allowed event fields', () => {
  expect(eventInputToColumns({ name: 'N', date: 'd', category: 'c', bogus: 1 }))
    .toEqual({ name: 'N', date: 'd', category: 'c' })
})
