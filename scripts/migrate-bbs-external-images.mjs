import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'bbs-media'
const MAX_SIZE = 10 * 1024 * 1024
const CACHE_CONTROL = '31536000'
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
])
const SOURCE_HOST = /(?:^|\.)fivemanage\.com$/i

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const backupOnly = args.has('--backup-only')
const limitArg = process.argv.find((value) => value.startsWith('--limit='))
const articleArg = process.argv.find((value) => value.startsWith('--article-id='))
const backupArg = process.argv.find((value) => value.startsWith('--backup-file='))
const limit = limitArg ? Math.max(1, Number(limitArg.slice('--limit='.length))) : Number.POSITIVE_INFINITY
const onlyArticleId = articleArg?.slice('--article-id='.length) || null
const backupFile = path.resolve(process.cwd(), backupArg?.slice('--backup-file='.length) || `backups/bbs-media-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)

if (dryRun && backupOnly) throw new Error('--dry-run과 --backup-only는 함께 사용할 수 없습니다.')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

function writeBackup(manifest, { overwrite = false } = {}) {
  if (!overwrite && existsSync(backupFile)) throw new Error(`백업 파일이 이미 존재합니다. 다른 경로를 지정하세요: ${backupFile}`)
  mkdirSync(path.dirname(backupFile), { recursive: true })
  manifest.updated_at = new Date().toISOString()
  writeFileSync(backupFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value).trim())
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

function isAllowedSource(value) {
  const url = normalizeUrl(value)
  if (!url || isStorageUrl(url)) return false
  const parsed = new URL(url)
  return parsed.protocol === 'https:' && SOURCE_HOST.test(parsed.hostname)
}

function collectImageUrls(content) {
  const urls = []
  const markdownPattern = /!\[[^\]]*\]\(\s*<?(https?:\/\/[^)\s>]+)>?\s*\)/gi
  const htmlPattern = /<img\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi
  for (const pattern of [markdownPattern, htmlPattern]) {
    for (const match of content.matchAll(pattern)) {
      const url = normalizeUrl(match[1])
      if (url) urls.push(url)
    }
  }
  return urls
}

function extractImageUrls(content, thumbnailUrl, mediaRows) {
  const urls = [...collectImageUrls(content)]
  const thumbnail = normalizeUrl(thumbnailUrl || '')
  if (thumbnail) urls.push(thumbnail)
  for (const row of mediaRows) {
    const url = normalizeUrl(row.image_url)
    if (url) urls.push(url)
  }
  return [...new Set(urls)]
}

function countImageReferences(content, thumbnailUrl, mediaRows) {
  const bodyCount = collectImageUrls(content).length
  const thumbnailCount = normalizeUrl(thumbnailUrl || '') ? 1 : 0
  const mediaCount = mediaRows.filter((row) => normalizeUrl(row.image_url)).length
  return bodyCount + thumbnailCount + mediaCount
}

function replaceUrls(value, replacements) {
  let result = value
  for (const [source, target] of replacements) result = result.split(source).join(target)
  return result
}

async function uploadImage(articleId, sourceUrl) {
  if (!isAllowedSource(sourceUrl)) throw new Error(`허용되지 않은 원본 URL: ${sourceUrl}`)
  const response = await fetch(sourceUrl, { redirect: 'follow' })
  if (!response.ok) throw new Error(`${response.status} ${sourceUrl}`)
  if (!isAllowedSource(response.url)) throw new Error(`허용되지 않은 리다이렉트: ${response.url}`)

  const contentType = (response.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase()
  const extension = ALLOWED_TYPES.get(contentType)
  if (!extension) throw new Error(`지원하지 않는 형식 ${contentType || '(없음)'}: ${sourceUrl}`)
  const storageContentType = contentType === 'image/jpg' ? 'image/jpeg' : contentType
  const contentLength = Number(response.headers.get('content-length') || 0)
  if (contentLength > MAX_SIZE) throw new Error(`10MB 초과: ${sourceUrl}`)

  const body = Buffer.from(await response.arrayBuffer())
  if (!body.length || body.length > MAX_SIZE) throw new Error(`10MB 초과: ${sourceUrl}`)

  const hash = createHash('sha256').update(body).digest('hex')
  const path = `articles/${articleId}/${hash}.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: storageContentType,
    cacheControl: CACHE_CONTROL,
    upsert: false,
  })
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(`Storage 업로드 실패: ${error.message}`)
  return {
    path,
    url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    created: !error,
  }
}

const { data: articles, error: articleError } = await supabase
  .from('bbs_articles')
  .select('id, content, thumbnail_url')
  .order('approved_at', { ascending: true })

if (articleError) throw new Error(`기사 조회 실패: ${articleError.message}`)

const articleRows = (articles || [])
  .filter((article) => !onlyArticleId || article.id === onlyArticleId)
  .slice(0, limit)
const articleIds = articleRows.map((article) => article.id)
const { data: mediaRows, error: mediaError } = articleIds.length
  ? await supabase.from('bbs_article_media').select('id, article_id, image_url').in('article_id', articleIds)
  : { data: [], error: null }
if (mediaError) throw new Error(`기사 첨부 이미지 조회 실패: ${mediaError.message}`)

const mediaByArticle = new Map()
for (const row of mediaRows || []) {
  const current = mediaByArticle.get(row.article_id) || []
  current.push(row)
  mediaByArticle.set(row.article_id, current)
}

const candidates = articleRows.map((article) => {
  const articleMedia = mediaByArticle.get(article.id) || []
  const bodyImageCount = collectImageUrls(article.content || '').length
  const sourceUrls = extractImageUrls(article.content || '', article.thumbnail_url, articleMedia)
    .filter((url) => !isStorageUrl(url))
  return {
    article,
    articleMedia,
    bodyImageCount,
    sourceUrls,
    referenceCount: countImageReferences(article.content || '', article.thumbnail_url, articleMedia),
  }
}).filter((candidate) => candidate.sourceUrls.length > 0)

const backupCandidates = candidates.map(({ article, articleMedia }) => ({
  article,
  media: articleMedia,
}))

let scanned = articleRows.length
let changed = 0
let uploaded = 0
let skipped = articleRows.length - candidates.length
const failures = []

let manifest = null
if (!dryRun) {
  manifest = {
    version: 1,
    created_at: new Date().toISOString(),
    bucket: BUCKET,
    source: 'scripts/migrate-bbs-external-images.mjs',
    articles: backupCandidates.map(({ article }) => ({
      id: article.id,
      content: article.content || '',
      thumbnail_url: article.thumbnail_url || null,
      status: 'pending',
    })),
    media: backupCandidates.flatMap(({ media }) => media.map((row) => ({
      id: row.id,
      article_id: row.article_id,
      image_url: row.image_url,
    }))),
    created_storage_paths: [],
    migrated_article_ids: [],
  }
  writeBackup(manifest)
  console.log(`백업 생성: ${backupFile}`)
  if (backupOnly) {
    console.log(JSON.stringify({ backup_file: backupFile, articles: manifest.articles.length, media: manifest.media.length }, null, 2))
    process.exit(0)
  }
}

for (const candidate of candidates) {
  const { article, articleMedia, bodyImageCount, sourceUrls, referenceCount } = candidate

  if (dryRun) {
    console.log(`[dry-run] ${article.id}: 고유 원본 ${sourceUrls.length}개 / 본문 이미지 ${bodyImageCount}장 / 대표·첨부 포함 ${referenceCount}건`)
    changed += 1
    continue
  }

  const replacements = new Map()
  const createdPaths = []
  const snapshot = manifest.articles.find((entry) => entry.id === article.id)
  try {
    snapshot.status = 'uploading'
    writeBackup(manifest, { overwrite: true })
    for (const sourceUrl of sourceUrls) {
      const result = await uploadImage(article.id, sourceUrl)
      replacements.set(sourceUrl, result.url)
      if (result.created) {
        createdPaths.push(result.path)
        manifest.created_storage_paths.push(result.path)
        uploaded += 1
        writeBackup(manifest, { overwrite: true })
      }
    }

    const nextContent = replaceUrls(article.content || '', replacements)
    const currentThumbnail = normalizeUrl(article.thumbnail_url || '')
    const nextThumbnail = currentThumbnail
      ? replacements.get(currentThumbnail) || currentThumbnail
      : collectImageUrls(nextContent)[0] || null
    snapshot.status = 'db_update_started'
    writeBackup(manifest, { overwrite: true })
    const { error: updateError } = await supabase.from('bbs_articles').update({
      content: nextContent,
      thumbnail_url: nextThumbnail,
    }).eq('id', article.id)
    if (updateError) throw new Error(`기사 갱신 실패: ${updateError.message}`)

    for (const media of articleMedia) {
      const currentUrl = normalizeUrl(media.image_url)
      const nextUrl = currentUrl ? replacements.get(currentUrl) : null
      if (nextUrl) {
        const { error } = await supabase.from('bbs_article_media').update({ image_url: nextUrl }).eq('id', media.id)
        if (error) throw new Error(`첨부 이미지 갱신 실패: ${error.message}`)
      }
    }

    snapshot.status = 'completed'
    manifest.migrated_article_ids = [...(manifest.migrated_article_ids || []), article.id]
    writeBackup(manifest, { overwrite: true })
    changed += 1
    console.log(`[migrated] ${article.id}: 고유 원본 ${sourceUrls.length}개 / 본문 이미지 ${bodyImageCount}장 / 대표·첨부 포함 ${referenceCount}건`)
  } catch (error) {
    const { error: restoreArticleError } = await supabase.from('bbs_articles').update({
      content: article.content || '',
      thumbnail_url: article.thumbnail_url || null,
    }).eq('id', article.id)
    if (restoreArticleError) failures.push(`${article.id}: 부분 갱신 롤백 실패: ${restoreArticleError.message}`)
    for (const media of articleMedia) {
      const { error: restoreMediaError } = await supabase.from('bbs_article_media').update({ image_url: media.image_url }).eq('id', media.id)
      if (restoreMediaError) failures.push(`${article.id}: 첨부 이미지 롤백 실패: ${restoreMediaError.message}`)
    }
    const { error: cleanupError } = createdPaths.length
      ? await supabase.storage.from(BUCKET).remove(createdPaths)
      : { error: null }
    if (cleanupError) {
      failures.push(`${article.id}: 부분 업로드 파일 정리 실패: ${cleanupError.message}`)
    } else {
      manifest.created_storage_paths = manifest.created_storage_paths.filter((storagePath) => !createdPaths.includes(storagePath))
    }
    snapshot.status = 'failed'
    writeBackup(manifest, { overwrite: true })
    failures.push(`${article.id}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

console.log(JSON.stringify({ backup_file: dryRun ? null : backupFile, scanned, changed, skipped, uploaded, failures }, null, 2))
if (failures.length) process.exitCode = 1
