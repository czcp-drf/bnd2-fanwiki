import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = fileURLToPath(new URL('../public/', import.meta.url))
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Load .env.local with node --env-file=.env.local')
const storage = createClient(url, key, { auth: { persistSession: false } }).storage
const bucket = 'map-tiles'
const { error: bucketError } = await storage.getBucket(bucket)
if (bucketError) throw new Error(bucketError.message)

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(target) : /\.(jpg|png)$/i.test(entry.name) ? [target] : []
  }))).flat()
}

const files = await walk(path.join(root, 'mapStyles'))
let cursor = 0, uploaded = 0, existing = 0, failed = 0
console.log(`Uploading ${files.length} images to ${bucket}; existing objects are preserved.`)
await Promise.all(Array.from({ length: 12 }, async () => {
  while (cursor < files.length) {
    const file = files[cursor++]
    const object = path.relative(root, file).split(path.sep).join('/')
    const body = await readFile(file)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { error } = await storage.from(bucket).upload(object, body, {
          contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg',
          cacheControl: '3600', upsert: false,
        })
        if (!error) { uploaded++; break }
        if (String(error.statusCode) === '409' || /already exists|duplicate/i.test(error.message)) {
          existing++; break
        }
        throw error
      } catch (error) {
        if (attempt === 2) { failed++; console.error(`${object}: ${error.message}`) }
        else await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
    const done = uploaded + existing + failed
    if (done % 100 === 0 || done === files.length) console.log(`${done}/${files.length}: uploaded=${uploaded}, existing=${existing}, failed=${failed}`)
  }
}))
if (failed) process.exitCode = 1
