import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'bbs-media'
const REMOVE_BATCH_SIZE = 100
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const confirmed = args.includes('--confirm')
const backupArg = args.find((value) => value.startsWith('--backup-file='))
const positionalBackup = args.find((value) => !value.startsWith('--'))
const backupFile = path.resolve(process.cwd(), backupArg?.slice('--backup-file='.length) || positionalBackup || '')

if (!backupFile || backupFile === path.resolve(process.cwd())) {
  throw new Error('백업 파일 경로가 필요합니다. 예: npm run rollback:bbs-images -- --dry-run backups/bbs-media-migration-....json')
}
if (!dryRun && !confirmed) throw new Error('실제 롤백에는 --confirm 옵션이 필요합니다.')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')

const manifest = JSON.parse(readFileSync(backupFile, 'utf8'))
if (manifest.version !== 1 || manifest.bucket !== BUCKET) throw new Error('지원하지 않는 백업 manifest입니다.')
if (!Array.isArray(manifest.articles) || !Array.isArray(manifest.media) || !Array.isArray(manifest.created_storage_paths)) {
  throw new Error('백업 manifest 구조가 올바르지 않습니다.')
}
const originalSourceMappings = Array.isArray(manifest.source_mappings) ? manifest.source_mappings : []

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
const restorableArticles = manifest.articles.filter((article) => article.status && article.status !== 'pending' && article.status !== 'rolled_back')
const restorableIds = new Set(restorableArticles.map((article) => article.id))
const restorableMedia = manifest.media.filter((media) => restorableIds.has(media.article_id))
const restorableSourceMappings = originalSourceMappings.filter((mapping) => restorableIds.has(mapping.article_id))
const storagePaths = manifest.created_storage_paths.filter((storagePath) => (
  typeof storagePath === 'string' && /^articles\/[0-9a-f-]{36}\/[a-f0-9]{64}\.(jpg|png|webp|gif|avif)$/.test(storagePath)
))

console.log(JSON.stringify({
  backup_file: backupFile,
  articles: restorableArticles.length,
  media: restorableMedia.length,
  source_mappings: restorableSourceMappings.length,
  storage_files: storagePaths.length,
  dry_run: dryRun,
}, null, 2))

if (dryRun) process.exit(0)

const failures = []
for (const article of restorableArticles) {
  const { error } = await supabase.from('bbs_articles').update({
    content: article.content || '',
    thumbnail_url: article.thumbnail_url || null,
  }).eq('id', article.id)
  if (error) failures.push(`기사 ${article.id}: ${error.message}`)
}

for (const media of restorableMedia) {
  const { error } = await supabase.from('bbs_article_media').update({ image_url: media.image_url }).eq('id', media.id)
  if (error) failures.push(`첨부 ${media.id}: ${error.message}`)
}

for (const article of restorableArticles) {
  const { error: deleteError } = await supabase.from('bbs_article_media_sources').delete().eq('article_id', article.id)
  if (deleteError) failures.push(`기사 ${article.id}: 이미지 원본 매핑 삭제 실패: ${deleteError.message}`)
}

if (!failures.length && restorableSourceMappings.length) {
  const { error: insertError } = await supabase.from('bbs_article_media_sources').insert(restorableSourceMappings)
  if (insertError) failures.push(`이미지 원본 매핑 복구 실패: ${insertError.message}`)
}

if (failures.length) {
  console.error(JSON.stringify({ restored: false, failures }, null, 2))
  process.exitCode = 1
} else {
  for (let index = 0; index < storagePaths.length; index += REMOVE_BATCH_SIZE) {
    const batch = storagePaths.slice(index, index + REMOVE_BATCH_SIZE)
    const { error } = await supabase.storage.from(BUCKET).remove(batch)
    if (error) failures.push(`Storage ${index + 1}-${index + batch.length}: ${error.message}`)
  }

  if (failures.length) {
    console.error(JSON.stringify({ restored: true, storage_deleted: false, failures }, null, 2))
    process.exitCode = 1
  } else {
    for (const article of restorableArticles) article.status = 'rolled_back'
    manifest.rolled_back_at = new Date().toISOString()
    writeFileSync(backupFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    console.log(JSON.stringify({ restored: true, storage_deleted: storagePaths.length, backup_file: backupFile }, null, 2))
  }
}
