import test from 'node:test'
import assert from 'node:assert/strict'
import { groupOrganizationMembers } from '../src/lib/data/organization-members.ts'

test('departure is independent of character activity and restoration returns membership to current', () => {
  const member = { left_at: null, sort_order: 0, characters: { status: 'active' } }
  assert.equal(groupOrganizationMembers([member]).active.length, 1)
  const departed = { ...member, left_at: '2026-09-12T00:00:00Z' }
  const groups = groupOrganizationMembers([departed])
  assert.equal(groups.active.length + groups.inactive.length, 0)
  assert.equal(groups.former.length, 1)
  assert.equal(groupOrganizationMembers([{ ...departed, left_at: null }]).active.length, 1)
})

test('current inactive members count separately, former inactive members and missing characters do not count', () => {
  const rows = [
    { left_at: null, sort_order: 2, characters: { status: 'hiatus' } },
    { left_at: '2026-09-12', sort_order: 0, characters: { status: 'dead' } },
    { left_at: null, sort_order: 1, characters: { status: 'retired' } },
    { left_at: null, sort_order: 0, characters: null },
  ]
  const before = [...rows]
  const groups = groupOrganizationMembers(rows)
  assert.equal(groups.active.length, 0)
  assert.deepEqual(groups.inactive.map(row => row.sort_order), [1, 2])
  assert.equal(groups.former.length, 1)
  assert.deepEqual(rows, before)
})
