import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const BBS_MEDIA_BUCKET = 'bbs-media'
export const BBS_MEDIA_CACHE_CONTROL = '31536000'
export const BBS_MEDIA_MAX_SIZE = 10 * 1024 * 1024

export const BBS_ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
])

const STORAGE_PATH_PATTERN = /^articles\/[0-9a-f-]+\/(?:[0-9a-f-]+|[0-9a-f]{64})\.(jpg|png|webp|gif|avif)$/i
const EXTERNAL_SOURCE_HOST_PATTERN = /(?:^|\.)fivemanage\.com$/i

type BbsSupabaseClient = SupabaseClient<Database>

export type BbsImageMigrationResult = {
  content: string
  thumbnailUrl: string | null
  uploadedPaths: string[]
}

function normalizeImageUrl(value: string) {
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export function isBbsStorageUrl(value: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return false

  try {
    const url = new URL(value)
    const origin = new URL(supabaseUrl).origin
    return url.origin === origin && url.pathname.startsWith(`/storage/v1/object/public/${BBS_MEDIA_BUCKET}/`)
  } catch {
    return false
  }
}

export function isAllowedBbsExternalImageUrl(value: string) {
  const normalized = normalizeImageUrl(value)
  if (!normalized || isBbsStorageUrl(normalized)) return false

  try {
    const url = new URL(normalized)
    return url.protocol === 'https:' && EXTERNAL_SOURCE_HOST_PATTERN.test(url.hostname)
  } catch {
    return false
  }
}

export function isBbsStoragePath(value: string) {
  return STORAGE_PATH_PATTERN.test(value)
}

function collectImageUrls(content: string) {
  const urls: string[] = []
  const markdownPattern = /!\[[^\]]*\]\(\s*<?(https?:\/\/[^)\s>]+)>?\s*\)/gi
  const htmlPattern = /<img\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>/gi

  for (const pattern of [markdownPattern, htmlPattern]) {
    for (const match of content.matchAll(pattern)) {
      const url = normalizeImageUrl(match[1])
      if (url) urls.push(url)
    }
  }

  return urls
}

export function extractBbsImageUrls(content: string, thumbnailUrl = '') {
  const urls = [...collectImageUrls(content)]
  const thumbnail = normalizeImageUrl(thumbnailUrl)
  if (thumbnail) urls.push(thumbnail)
  return [...new Set(urls)]
}

export function getFirstBbsImageUrl(content: string) {
  return collectImageUrls(content)[0] ?? null
}

export function replaceBbsImageUrls(value: string, replacements: Map<string, string>) {
  let result = value
  for (const [source, target] of replacements) result = result.split(source).join(target)
  return result
}

function getPublicUrl(supabase: BbsSupabaseClient, path: string) {
  return supabase.storage.from(BBS_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

async function uploadExternalBbsImage(supabase: BbsSupabaseClient, articleId: string, sourceUrl: string) {
  if (!isAllowedBbsExternalImageUrl(sourceUrl)) throw new Error('허용되지 않은 이미지 원본 주소입니다.')

  const response = await fetch(sourceUrl, { redirect: 'follow' })
  if (!response.ok) throw new Error(`이미지 다운로드 실패 (${response.status})`)
  if (!isAllowedBbsExternalImageUrl(response.url)) throw new Error('허용되지 않은 이미지 리다이렉트입니다.')

  const contentType = (response.headers.get('content-type') ?? '').split(';', 1)[0].trim().toLowerCase()
  const extension = BBS_ALLOWED_IMAGE_TYPES.get(contentType)
  if (!extension) throw new Error('지원하지 않는 이미지 형식입니다.')
  const storageContentType = contentType === 'image/jpg' ? 'image/jpeg' : contentType

  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > BBS_MEDIA_MAX_SIZE) throw new Error('이미지 용량이 10MB를 초과합니다.')

  const body = Buffer.from(await response.arrayBuffer())
  if (!body.length || body.length > BBS_MEDIA_MAX_SIZE) throw new Error('이미지 용량이 10MB를 초과합니다.')

  const hash = createHash('sha256').update(body).digest('hex')
  const path = `articles/${articleId}/${hash}.${extension}`
  const { error } = await supabase.storage.from(BBS_MEDIA_BUCKET).upload(path, body, {
    contentType: storageContentType,
    cacheControl: BBS_MEDIA_CACHE_CONTROL,
    upsert: false,
  })

  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(`Storage 업로드 실패: ${error.message}`)
  return { path, publicUrl: getPublicUrl(supabase, path) }
}

export async function migrateBbsImageFields(
  supabase: BbsSupabaseClient,
  articleId: string,
  content: string,
  thumbnailUrl: string | null,
): Promise<BbsImageMigrationResult> {
  const sourceUrls = extractBbsImageUrls(content, thumbnailUrl ?? '')
    .filter((url) => !isBbsStorageUrl(url))

  const replacements = new Map<string, string>()
  const uploadedPaths: string[] = []
  try {
    for (const sourceUrl of sourceUrls) {
      const uploaded = await uploadExternalBbsImage(supabase, articleId, sourceUrl)
      replacements.set(sourceUrl, uploaded.publicUrl)
      uploadedPaths.push(uploaded.path)
    }
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from(BBS_MEDIA_BUCKET).remove(uploadedPaths)
    throw error
  }

  const nextContent = replaceBbsImageUrls(content, replacements)
  const normalizedThumbnail = normalizeImageUrl(thumbnailUrl ?? '')
  const nextThumbnail = normalizedThumbnail
    ? replacements.get(normalizedThumbnail) ?? normalizedThumbnail
    : getFirstBbsImageUrl(nextContent)

  return { content: nextContent, thumbnailUrl: nextThumbnail, uploadedPaths }
}
