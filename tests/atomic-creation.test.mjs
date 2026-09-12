import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('creation functions commit complete records or roll back every insert', async () => {
  const db = new PGlite()
  try {
    await db.exec('create role anon; create role authenticated; create role service_role;')
    const schema = await fs.readFile('supabase/schema.sql', 'utf8')
    await db.exec(schema.slice(0, schema.indexOf('-- character_relationships')))
    const migration = await fs.readFile('supabase/migrations/017_atomic_creation.sql', 'utf8')
    await db.exec(migration)
    await db.exec(migration) // Reapplying definitions preserves existing schema.
    const count = async (table) => (await db.query(`select count(*)::int as n from ${table}`)).rows[0].n
    const createCharacter = (orgId, streamerId = null) => db.query(
      'select public.create_character_with_membership($1,$2,$3,$4,$5,$6) as id',
      ['  테스트  ', streamerId, '  가이드  ', 'active', orgId, '  직원  '],
    )
    const createStreamer = (channel) => db.query(
      'select public.create_streamer_with_character($1,$2,$3) as id', [channel, '  테스트 방송  ', ''],
    )
    const org = (await db.query("insert into organizations(name) values ('조직') returning id")).rows[0].id
    const character = (await createCharacter(org)).rows[0].id
    const membership = (await db.query('select * from organization_members where character_id=$1', [character])).rows[0]
    assert.equal(membership.organization_id, org)
    assert.equal(membership.role, '직원')
    assert.equal(membership.is_primary, true)
    assert.equal((await db.query('select name from characters where id=$1', [character])).rows[0].name, '테스트')
    await createCharacter(null) // A standalone character remains supported.
    assert.equal(await count('organization_members'), 1)
    const beforeCharacters = await count('characters')
    await assert.rejects(createCharacter('00000000-0000-0000-0000-000000000001'), { code: '23503' })
    assert.equal(await count('characters'), beforeCharacters)
    await assert.rejects(createCharacter(null, '00000000-0000-0000-0000-000000000002'), { code: '23503' })
    assert.equal(await count('characters'), beforeCharacters)

    const streamer = (await createStreamer('a'.repeat(32))).rows[0].id
    const placeholder = (await db.query('select name, status from characters where streamer_id=$1', [streamer])).rows
    assert.deepEqual(placeholder, [{ name: '미정', status: 'active' }])
    const beforeStreamers = await count('streamers')
    const beforePlaceholder = await count('characters')
    await assert.rejects(createStreamer('a'.repeat(32)), { code: '23505' })
    assert.equal(await count('characters'), beforePlaceholder)

    // Force failure specifically on the second insert, after a streamer was inserted.
    await db.exec(`create function fail_placeholder() returns trigger language plpgsql as $$
      begin if new.name = '미정' then raise exception 'forced failure' using errcode='23514'; end if; return new; end; $$;
      create trigger fail_placeholder before insert on characters for each row execute function fail_placeholder();`)
    await assert.rejects(createStreamer('b'.repeat(32)), { code: '23514' })
    assert.equal(await count('streamers'), beforeStreamers)
    assert.equal(await count('characters'), beforePlaceholder)

    for (const signature of [
      'public.create_character_with_membership(text,uuid,text,text,uuid,text)',
      'public.create_streamer_with_character(text,text,text)',
    ]) {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        const result = await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, signature])
        assert.equal(result.rows[0].allowed, role === 'service_role')
      }
    }
  } finally { await db.close() }
})
