import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { unwrapMutation } from '../src/lib/admin/mutation.ts'

function load(file, responses) {
  const invalidated = []
  const queue = [...responses]
  const chain = new Proxy({}, { get: (_, key) => key === 'then'
    ? (resolve) => Promise.resolve(queue.shift()).then(resolve)
    : () => chain })
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, { exports, require: (name) => {
    if (name === '@/lib/admin/auth') return { requireAdmin: async () => ({ from: () => chain }) }
    if (name === 'next/cache') return { revalidatePath: (path) => invalidated.push(path) }
    throw Error(name)
  } })
  return { actions: exports, invalidated }
}

test('map and streamer mutations reject DB errors and missing targets; invalidate only on success', async () => {
  const cases = [
    ['map', 'updateOrgHq', ['id', {}]], ['map', 'updateOrgBiz', ['id', {}]],
    ['map', 'addMapLocation', [{}]], ['map', 'updateMapLocation', ['id', {}]],
    ['map', 'deleteMapLocation', ['id']],
    ['streamers', 'updateStreamer', ['id', { display_name: 'Test', chzzk_channel_id: 'a'.repeat(32) }]],
    ['streamers', 'deleteStreamer', ['id']],
  ]
  for (const [folder, name, args] of cases) {
    for (const response of [{ error: { code: '23505' } }, { data: [], error: null }]) {
      const { actions, invalidated } = load(`src/app/admin/${folder}/actions.ts`, [response])
      assert.ok((await actions[name](...args)).error, name)
      assert.equal(invalidated.length, 0, name)
    }
    const { actions, invalidated } = load(`src/app/admin/${folder}/actions.ts`, [{ data: [{ id: 'id' }], error: null }])
    assert.equal((await actions[name](...args)).success, true, name)
    assert.ok(invalidated.length > 0, name)
  }
})

test('streamer creation reports duplicate and partial character creation failure', async () => {
  const form = new FormData()
  form.set('display_name', 'Test'); form.set('chzzk_channel_id', 'a'.repeat(32))
  let loaded = load('src/app/admin/streamers/actions.ts', [{ error: { code: '23505' } }])
  assert.match((await loaded.actions.addStreamer(form)).error, /이미 등록/)
  assert.equal(loaded.invalidated.length, 0)
  loaded = load('src/app/admin/streamers/actions.ts', [{ data: { id: 'id' } }, { error: { code: 'error' } }])
  assert.match((await loaded.actions.addStreamer(form)).error, /스트리머는 등록되었으나/)
})

test('client mutation guard stops success cleanup on returned and thrown errors', async () => {
  let cleaned = false
  for (const request of [() => Promise.resolve({ error: 'DB failure' }), () => Promise.reject(new Error('Network failure'))]) {
    await assert.rejects(async () => { await unwrapMutation(request()); cleaned = true })
    assert.equal(cleaned, false)
  }
  assert.equal((await unwrapMutation(Promise.resolve({ success: true }))).success, true)
})
