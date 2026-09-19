import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'bbs-media'
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const confirmed = args.includes('--confirm')
const backupArg = args.find((value) => value.startsWith('--backup-file='))
const positionalBackup = args.find((value) => !value.startsWith('--'))
const backupFile = path.resolve(process.cwd(), backupArg?.slice('--backup-file='.length) || positionalBackup || '')

if (!backupFile || backupFile === path.resolve(process.cwd())) {
  throw new Error('기존 백업 파일 경로가 필요합니다.')
}
if (!dryRun && !confirmed) throw new Error('실제 매핑 복구에는 --confirm 옵션이 필요합니다.')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')

const manifest = JSON.parse(readFileSync(backupFile, 'utf8'))
if (manifest.bucket !== BUCKET || !Array.isArray(manifest.articles) || !Array.isArray(manifest.media)) {
  throw new Error('지원하지 않는 BBS 이미지 백업 manifest입니다.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
const articleIds = manifest.articles.map((article) => article.id)
const { data: currentArticles, error: articleError } = articleIds.length
  ? await supabase.from('bbs_articles').select('id, content, thumbnail_url').in('id', articleIds)
  : { data: [], error: null }
if (articleError) throw new Error(`현재 기사 조회 실패: ${articleError.message}`)

const { data: currentMedia, error: mediaError } = articleIds.length
  ? await supabase.from('bbs_article_media').select('id, article_id, image_url').in('article_id', articleIds)
  : { data: [], error: null }
if (mediaError) throw new Error(`현재 첨부 이미지 조회 실패: ${mediaError.message}`)

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

function isStorageUrl(value) {
  const url = normalizeUrl(value)
  if (!url) return false
  const parsed = new URL(url)
  return parsed.origin === new URL(supabaseUrl).origin && parsed.pathname.startsWith(`/storage/v1/object/public/${BUCKET}/`)
}

function collectImageUrls(content) {
  const urls = []
  const patterns = [
    /!\[[^\]]*\]\(\s*<?(https?:\/\/[^)\s>]+)>?\s*\)/gi,
    /<img\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi,
  ]
  for (const pattern of patterns) {
    for (const match of String(content || '').matchAll(pattern)) {
      const url = normalizeUrl(match[1])
      if (url) urls.push(url)
    }
  }
  return urls
}

function addPair(pairs, articleId, source, storage) {
  if (source && storage && !isStorageUrl(source) && isStorageUrl(storage)) {
    pairs.set(`${articleId}\n${source}\n${storage}`, { article_id: articleId, source_url: source, storage_url: storage })
  }
}

const currentArticleById = new Map((currentArticles || []).map((article) => [article.id, article]))
const currentMediaById = new Map((currentMedia || []).map((media) => [media.id, media]))
const sourceMappings = new Map()
const skipped = []

for (const original of manifest.articles) {
  const current = currentArticleById.get(original.id)
  if (!current) {
    skipped.push(`${original.id}: 현재 기사가 없음`)
    continue
  }

  const originalBody = collectImageUrls(original.content)
  const currentBody = collectImageUrls(current.content)
  if (originalBody.length !== currentBody.length) {
    skipped.push(`${original.id}: 본문 이미지 수 불일치 (${originalBody.length}/${currentBody.length})`)
  }
  for (let index = 0; index < Math.min(originalBody.length, currentBody.length); index += 1) {
    addPair(sourceMappings, original.id, originalBody[index], currentBody[index])
  }

  addPair(sourceMappings, original.id, normalizeUrl(original.thumbnail_url), normalizeUrl(current.thumbnail_url))

  for (const originalMedia of manifest.media.filter((media) => media.article_id === original.id)) {
    const currentMediaRow = currentMediaById.get(originalMedia.id)
    addPair(sourceMappings, original.id, normalizeUrl(originalMedia.image_url), normalizeUrl(currentMediaRow?.image_url))
  }
}

const uniqueRows = [...sourceMappings.values()]
console.log(JSON.stringify({ backup_file: backupFile, articles: articleIds.length, mappings: uniqueRows.length, skipped, dry_run: dryRun }, null, 2))
if (dryRun) process.exit(0)

const byArticle = new Map()
for (const row of uniqueRows) {
  const current = byArticle.get(row.article_id) || []
  current.push(row)
  byArticle.set(row.article_id, current)
}

const failures = []
for (const articleId of articleIds) {
  const { error: deleteError } = await supabase.from('bbs_article_media_sources').delete().eq('article_id', articleId)
  if (deleteError) {
    failures.push(`${articleId}: 기존 매핑 삭제 실패: ${deleteError.message}`)
    continue
  }
  const rowsForArticle = byArticle.get(articleId) || []
  if (rowsForArticle.length) {
    const { error: insertError } = await supabase.from('bbs_article_media_sources').insert(rowsForArticle)
    if (insertError) failures.push(`${articleId}: 매핑 저장 실패: ${insertError.message}`)
  }
}

if (failures.length) {
  console.error(JSON.stringify({ completed: false, failures }, null, 2))
  process.exitCode = 1
} else {
  console.log(JSON.stringify({ completed: true, mappings: uniqueRows.length }, null, 2))
}
