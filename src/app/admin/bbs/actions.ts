'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import {
  BBS_ARTICLE_DETAILS_TAG,
  BBS_ARTICLE_LIST_TAG,
  BBS_ARTICLE_NEIGHBORS_TAG,
  getBbsArticleTag,
} from '@/lib/bbs/data'
import {
  BBS_ALLOWED_IMAGE_TYPES,
  BBS_MEDIA_BUCKET,
  BBS_MEDIA_MAX_SIZE,
  getFirstBbsImageUrl,
  isBbsStoragePath,
  isBbsStorageUrl,
  migrateBbsImageFields,
  extractBbsImageUrls,
  type BbsImageSourceMapping,
} from '@/lib/bbs/media'

const MAX_MEDIA_COUNT = 5
const BBS_CATEGORIES = new Set(['info', 'incident', 'economy', 'column', 'other'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ActionResult = { success?: true; id?: string; error?: string }

export type BbsImportRow = {
  externalId: string
  title: string
  category: string
  content: string
  thumbnailUrl: string
  reporterName: string
  reporterCharacterId?: string
  approvedAt: string
}

export type BbsImportFailure = { index: number; row: BbsImportRow; reason: string; canUseOriginalUrls: boolean }
export type BbsImportResult = { imported: number; skipped: number; errors: string[]; failedRows: BbsImportFailure[] }

export type BbsArticleInput = {
  title: string
  category: string
  summary: string
  content: string
  thumbnailUrl: string
  reporterCharacterId: string
  approvedAt: string
  isPublished: boolean
  media: { imageUrl: string; storagePath?: string | null }[]
}

export type BbsCommentInput = {
  articleId: string
  authorCharacterId: string
  content: string
  createdAt?: string
}

export type BbsCommentUpdateInput = {
  authorCharacterId: string
  content: string
  createdAt?: string
}

type ValidatedArticleInput = {
  title: string
  category: string
  summary: string | null
  content: string
  thumbnailUrl: string | null
  reporterCharacterId: string
  approvedAt: string | null
  isPublished: boolean
  media: { imageUrl: string; storagePath: string | null }[]
}

function validateStorageImageUrl(value: string, label: string) {
  if (!isBbsStorageUrl(value) || !extractStoragePath(value)) return `${label}는 bbs-media Storage URL이어야 합니다.`
  return null
}

function validateArticleInput(input: BbsArticleInput): { error: string } | { data: ValidatedArticleInput } {
  const title = input.title.trim()
  const category = input.category.trim()
  const summary = input.summary.trim()
  const content = input.content.trim()
  const thumbnailUrl = input.thumbnailUrl.trim()
  const reporterCharacterId = input.reporterCharacterId.trim()
  const approvedAt = input.approvedAt.trim()
  const media = input.media
    .map((item) => ({
      imageUrl: item.imageUrl.trim(),
      storagePath: item.storagePath?.trim() || null,
    }))
    .filter((item) => item.imageUrl)
  const firstContentImage = getFirstBbsImageUrl(content) ?? ''

  if (!title) return { error: '기사 제목을 입력해 주세요.' }
  if (title.length > 200) return { error: '기사 제목은 200자 이내로 입력해 주세요.' }
  if (!BBS_CATEGORIES.has(category)) return { error: '기사 말머리를 선택해 주세요.' }
  if (summary.length > 500) return { error: '기사 요약은 500자 이내로 입력해 주세요.' }
  if (content.length > 50000) return { error: '기사 본문은 50,000자 이내로 입력해 주세요.' }
  if (!UUID_PATTERN.test(reporterCharacterId)) return { error: '담당기자를 선택해 주세요.' }
  for (const imageUrl of extractBbsImageUrls(content)) {
    const error = validateStorageImageUrl(imageUrl, '본문 이미지')
    if (error) return { error }
  }
  if (thumbnailUrl) {
    const error = validateStorageImageUrl(thumbnailUrl, '대표 이미지 주소')
    if (error) return { error }
  }
  if (media.length > MAX_MEDIA_COUNT) return { error: `기사 이미지는 최대 ${MAX_MEDIA_COUNT}장까지 등록할 수 있습니다.` }
  for (const item of media) {
    const error = validateStorageImageUrl(item.imageUrl, '첨부 이미지 주소')
    if (error) return { error }
    if (item.storagePath && !isBbsStoragePath(item.storagePath)) return { error: 'Storage 이미지 경로가 올바르지 않습니다.' }
  }

  let approvedAtIso: string | null = null
  if (approvedAt) {
    const date = new Date(approvedAt)
    if (Number.isNaN(date.getTime())) return { error: '승인일시를 올바르게 입력해 주세요.' }
    approvedAtIso = date.toISOString()
  }
  if (input.isPublished && !approvedAtIso) return { error: '공개 기사는 승인일시를 입력해야 합니다.' }

  return {
    data: {
      title,
      category,
      summary: summary || null,
      content,
      thumbnailUrl: thumbnailUrl || firstContentImage || media[0]?.imageUrl || null,
      reporterCharacterId,
      approvedAt: approvedAtIso,
      isPublished: input.isPublished,
      media,
    },
  }
}

function extractStoragePath(imageUrl: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null

  try {
    const url = new URL(imageUrl)
    const origin = new URL(supabaseUrl).origin
    const prefix = `/storage/v1/object/public/${BBS_MEDIA_BUCKET}/`
    if (url.origin !== origin || !url.pathname.startsWith(prefix)) return null
    const path = decodeURIComponent(url.pathname.slice(prefix.length))
    return isBbsStoragePath(path) ? path : null
  } catch {
    return null
  }
}

async function removeStoragePaths(supabase: Awaited<ReturnType<typeof requireAdmin>>, paths: string[]) {
  const validPaths = [...new Set(paths)].filter((path) => isBbsStoragePath(path))
  if (!validPaths.length) return
  const { error } = await supabase.storage.from(BBS_MEDIA_BUCKET).remove(validPaths)
  if (error) console.error('BBS storage cleanup failed:', error.message)
}

function getArticleStoragePaths(content: string, thumbnailUrl: string | null, mediaUrls: string[]) {
  return new Set(
    [thumbnailUrl ?? '', ...extractBbsImageUrls(content), ...mediaUrls]
      .map((url) => extractStoragePath(url))
      .filter((path): path is string => Boolean(path)),
  )
}

function revalidateBbsList() {
  revalidatePath('/admin/bbs')
  revalidatePath('/bbs')
  revalidatePath('/api/bbs/latest')
  updateTag(BBS_ARTICLE_LIST_TAG)
}

function revalidateBbsNeighbors() {
  updateTag(BBS_ARTICLE_NEIGHBORS_TAG)
}

function revalidateBbsArticle(articleId: string) {
  updateTag(getBbsArticleTag(articleId))
  revalidatePath(`/bbs/article/${articleId}`)
}

function revalidateBbsAdmin() {
  revalidatePath('/admin/bbs')
}

export async function refreshBbsCache(): Promise<ActionResult> {
  await requireAdmin()
  revalidateBbsList()
  revalidateBbsNeighbors()
  updateTag(BBS_ARTICLE_DETAILS_TAG)
  return { success: true }
}

export async function createBbsUploadUrl(data: { fileName: string; contentType: string; size: number }) {
  const contentType = data.contentType.trim().toLowerCase()
  const extension = BBS_ALLOWED_IMAGE_TYPES.get(contentType)
  const fileName = data.fileName.trim()
  const size = Number(data.size)

  if (!extension) return { error: '지원하지 않는 이미지 형식입니다. JPG, PNG, WEBP, GIF, AVIF만 업로드할 수 있습니다.' }
  if (!fileName || fileName.length > 255) return { error: '파일 이름을 확인해 주세요.' }
  if (!Number.isFinite(size) || size <= 0 || size > BBS_MEDIA_MAX_SIZE) return { error: '이미지는 10MB 이하만 업로드할 수 있습니다.' }

  const supabase = await requireAdmin()
  const path = `articles/${crypto.randomUUID()}/${crypto.randomUUID()}.${extension}`
  const { data: signedUpload, error } = await supabase.storage
    .from(BBS_MEDIA_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !signedUpload) {
    console.error('BBS upload URL create failed:', error?.message)
    return { error: 'Storage 업로드 주소를 만들지 못했습니다. 034, 035 migration과 bbs-media 버킷을 확인해 주세요.' }
  }

  const { data: publicData } = supabase.storage.from(BBS_MEDIA_BUCKET).getPublicUrl(path)
  return { path, token: signedUpload.token, publicUrl: publicData.publicUrl }
}

export async function deleteBbsUploadedMedia(paths: string[]): Promise<ActionResult> {
  const supabase = await requireAdmin()
  await removeStoragePaths(supabase, paths)
  return { success: true }
}

async function saveBbsMedia(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  articleId: string,
  media: ValidatedArticleInput['media'],
) {
  const { data: oldMedia, error: oldMediaError } = await supabase
    .from('bbs_article_media')
    .select('image_url')
    .eq('article_id', articleId)
  if (oldMediaError) return { error: oldMediaError, oldPaths: [] as string[] }

  const oldPaths = (oldMedia ?? [])
    .map((item) => extractStoragePath(item.image_url))
    .filter((path): path is string => Boolean(path))
  const { error: deleteError } = await supabase.from('bbs_article_media').delete().eq('article_id', articleId)
  if (deleteError) return { error: deleteError, oldPaths }

  if (media.length) {
    const { error } = await supabase.from('bbs_article_media').insert(media.map((item, index) => ({
      article_id: articleId,
      image_url: item.imageUrl,
      sort_order: index,
    })))
    if (error) return { error, oldPaths }
  }

  const newPaths = new Set(media.map((item) => item.storagePath).filter((path): path is string => Boolean(path)))
  // Existing media loaded into the edit form may not have a storagePath field.
  // Keep any old object whose public URL is still present in the submitted media.
  const referencedPaths = new Set(media.map((item) => extractStoragePath(item.imageUrl)).filter((path): path is string => Boolean(path)))
  return { error: null, oldPaths: [...new Set([...oldPaths, ...referencedPaths])].filter((path) => !newPaths.has(path)) }
}

async function saveBbsImageSourceMappings(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  articleId: string,
  mappings: BbsImageSourceMapping[],
) {
  if (!mappings.length) return { error: null }
  const { error } = await supabase.from('bbs_article_media_sources').upsert(
    mappings.map((mapping) => ({
      article_id: articleId,
      source_url: mapping.sourceUrl,
      storage_url: mapping.storageUrl,
    })),
    { onConflict: 'article_id,source_url' },
  )
  return { error }
}

async function clearBbsImageSourceMappings(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  articleId: string,
) {
  const { error } = await supabase.from('bbs_article_media_sources').delete().eq('article_id', articleId)
  return { error }
}

export async function createBbsArticle(input: BbsArticleInput): Promise<ActionResult> {
  const validated = validateArticleInput(input)
  if ('error' in validated) return validated

  const supabase = await requireAdmin()
  const { data: reporter, error: reporterError } = await supabase
    .from('characters')
    .select('id')
    .eq('id', validated.data.reporterCharacterId)
    .maybeSingle()
  if (reporterError || !reporter) return { error: '담당기자를 확인하지 못했습니다.' }

  const { data: article, error } = await supabase
    .from('bbs_articles')
    .insert({
      title: validated.data.title,
      category: validated.data.category,
      summary: validated.data.summary,
      content: validated.data.content,
      thumbnail_url: validated.data.thumbnailUrl,
      approved_at: validated.data.approvedAt,
      is_published: validated.data.isPublished,
      reporter_character_id: validated.data.reporterCharacterId,
    })
    .select('id')
    .single()
  if (error || !article) {
    console.error('BBS article create failed:', error?.code, error?.message)
    return { error: '기사를 등록하지 못했습니다. 입력값과 migration 적용 상태를 확인해 주세요.' }
  }

  const mediaResult = await saveBbsMedia(supabase, article.id, validated.data.media)
  if (mediaResult.error) {
    await supabase.from('bbs_articles').delete().eq('id', article.id)
    await removeStoragePaths(supabase, validated.data.media.map((item) => item.storagePath).filter((path): path is string => Boolean(path)))
    console.error('BBS article media create failed:', mediaResult.error.code, mediaResult.error.message)
    return { error: '기사 이미지를 등록하지 못했습니다.' }
  }

  if (validated.data.isPublished) {
    revalidateBbsList()
    revalidateBbsNeighbors()
  } else {
    revalidateBbsAdmin()
  }
  return { success: true, id: article.id }
}

export async function updateBbsArticle(id: string, input: BbsArticleInput): Promise<ActionResult> {
  const articleId = id.trim()
  if (!UUID_PATTERN.test(articleId)) return { error: '수정할 기사를 찾을 수 없습니다.' }
  const validated = validateArticleInput(input)
  if ('error' in validated) return validated

  const supabase = await requireAdmin()
  const [{ data: reporter, error: reporterError }, { data: previousArticle, error: previousArticleError }] = await Promise.all([
    supabase.from('characters').select('id').eq('id', validated.data.reporterCharacterId).maybeSingle(),
    supabase.from('bbs_articles').select('content, thumbnail_url, is_published').eq('id', articleId).maybeSingle(),
  ])
  if (reporterError || !reporter) return { error: '담당기자를 확인하지 못했습니다.' }
  if (previousArticleError || !previousArticle) return { error: '수정할 기사를 찾을 수 없습니다.' }

  const { error } = await supabase.from('bbs_articles').update({
    title: validated.data.title,
    category: validated.data.category,
    summary: validated.data.summary,
    content: validated.data.content,
    thumbnail_url: validated.data.thumbnailUrl,
    approved_at: validated.data.approvedAt,
    is_published: validated.data.isPublished,
    reporter_character_id: validated.data.reporterCharacterId,
  }).eq('id', articleId)
  if (error) {
    console.error('BBS article update failed:', error.code, error.message)
    return { error: '기사를 수정하지 못했습니다.' }
  }

  const mediaResult = await saveBbsMedia(supabase, articleId, validated.data.media)
  if (mediaResult.error) {
    console.error('BBS article media update failed:', mediaResult.error.code, mediaResult.error.message)
    return { error: '기사 이미지를 수정하지 못했습니다.' }
  }

  const sourceMappingResult = await clearBbsImageSourceMappings(supabase, articleId)
  if (sourceMappingResult.error) {
    console.error('BBS article image source mapping cleanup failed:', sourceMappingResult.error.message)
    return { error: '기사 이미지 원본 연결을 갱신하지 못했습니다.' }
  }

  const previousPaths = getArticleStoragePaths(previousArticle.content, previousArticle.thumbnail_url, mediaResult.oldPaths)
  const nextPaths = getArticleStoragePaths(
    validated.data.content,
    validated.data.thumbnailUrl,
    validated.data.media.map((item) => item.imageUrl),
  )
  await removeStoragePaths(supabase, [...previousPaths].filter((path) => !nextPaths.has(path)))

  revalidateBbsAdmin()
  if (previousArticle.is_published || validated.data.isPublished) {
    revalidateBbsList()
    revalidateBbsNeighbors()
  }
  revalidateBbsArticle(articleId)
  return { success: true }
}

export async function importBbsArticles(rows: BbsImportRow[]): Promise<BbsImportResult> {
  const supabase = await requireAdmin()
  const safeRows = rows.slice(0, 500)
  const externalIds = [...new Set(safeRows.map((row) => row.externalId.trim()).filter(Boolean))]
  const { data: existingRows, error: existingError } = externalIds.length
    ? await supabase.from('bbs_articles').select('external_id').in('external_id', externalIds)
    : { data: [], error: null }
  if (existingError) return {
    imported: 0,
    skipped: 0,
    errors: ['기존 기사 중복 여부를 확인하지 못했습니다.'],
    failedRows: safeRows.map((row, index) => ({ index: index + 1, row, reason: '기존 기사 중복 여부를 확인하지 못했습니다.', canUseOriginalUrls: false })),
  }

  const existingIds = new Set((existingRows ?? []).map((row) => row.external_id).filter((id): id is string => Boolean(id)))
  const candidates = safeRows.filter((row) => row.externalId.trim() && !existingIds.has(row.externalId.trim()))
  const reporterNames = [...new Set(candidates.map((row) => row.reporterName.trim()).filter(Boolean))]
  const { data: reporterRows, error: reporterError } = reporterNames.length
    ? await supabase.from('characters').select('id, name').in('name', reporterNames)
    : { data: [], error: null }
  if (reporterError) return {
    imported: 0,
    skipped: existingIds.size,
    errors: ['담당기자 목록을 확인하지 못했습니다.'],
    failedRows: candidates.map((row, index) => ({ index: index + 1, row, reason: '담당기자 목록을 확인하지 못했습니다.', canUseOriginalUrls: false })),
  }
  const reporterByName = new Map((reporterRows ?? []).map((row) => [row.name, row.id]))
  let imported = 0
  const errors: string[] = []
  const failedRows: BbsImportFailure[] = []

  for (const [index, row] of candidates.entries()) {
    const reporterId = row.reporterCharacterId && UUID_PATTERN.test(row.reporterCharacterId) ? row.reporterCharacterId : reporterByName.get(row.reporterName.trim())
    const approvedAt = row.approvedAt.trim()
    const approvedDate = approvedAt ? new Date(/^[0-9]{4}-[0-9]{2}-[0-9]{2} /.test(approvedAt) ? `${approvedAt.replace(' ', 'T')}+09:00` : approvedAt) : null
    const validationError = !row.title.trim() || !BBS_CATEGORIES.has(row.category.trim()) || !reporterId || !row.content.trim() || !approvedDate || Number.isNaN(approvedDate.getTime())
      ? '제목·카테고리·본문·담당기자·승인일시를 확인해 주세요.'
      : null
    if (validationError) {
      errors.push(`${index + 1}번째 기사: ${validationError}`)
      failedRows.push({ index: index + 1, row, reason: validationError, canUseOriginalUrls: false })
      continue
    }
    const rawContent = row.content.trim().slice(0, 50000)
    const rawThumbnailUrl = row.thumbnailUrl.trim() || null
    const approvedAtIso = approvedDate?.toISOString() ?? ''
    const { data: article, error } = await supabase.from('bbs_articles').insert({
      title: row.title.trim().slice(0, 200),
      category: row.category.trim(),
      summary: null,
      content: rawContent,
      thumbnail_url: rawThumbnailUrl,
      approved_at: approvedAtIso,
      is_published: false,
      reporter_character_id: reporterId,
      source: 'ingame',
      external_id: row.externalId.trim(),
    }).select('id').single()
    if (error || !article) {
      const reason = '기사를 저장하지 못했습니다.'
      errors.push(`${index + 1}번째 기사: ${reason}`)
      failedRows.push({ index: index + 1, row, reason, canUseOriginalUrls: false })
      continue
    }

    let uploadedPaths: string[] = []
    try {
      const migrated = await migrateBbsImageFields(supabase, article.id, rawContent, rawThumbnailUrl)
      uploadedPaths = migrated.uploadedPaths
      const { error: imageUpdateError } = await supabase
        .from('bbs_articles')
        .update({ content: migrated.content, thumbnail_url: migrated.thumbnailUrl })
        .eq('id', article.id)
      if (imageUpdateError) throw new Error(imageUpdateError.message)
      const mappingResult = await saveBbsImageSourceMappings(supabase, article.id, migrated.sourceMappings)
      if (mappingResult.error) throw new Error(`이미지 원본 연결 저장 실패: ${mappingResult.error.message}`)
    } catch (imageError) {
      await supabase.from('bbs_articles').delete().eq('id', article.id)
      if (uploadedPaths.length) await supabase.storage.from(BBS_MEDIA_BUCKET).remove(uploadedPaths)
      const reason = `이미지 이전에 실패했습니다. ${imageError instanceof Error ? imageError.message : ''}`.trim()
      errors.push(`${index + 1}번째 기사: ${reason}`)
      failedRows.push({ index: index + 1, row, reason, canUseOriginalUrls: true })
      continue
    }
    imported += 1
  }

  revalidateBbsAdmin()
  return { imported, skipped: safeRows.length - candidates.length, errors, failedRows }
}

export async function importBbsArticleWithOriginalUrls(row: BbsImportRow): Promise<ActionResult> {
  const supabase = await requireAdmin()
  const externalId = row.externalId.trim()
  const title = row.title.trim()
  const category = row.category.trim()
  const content = row.content.trim().slice(0, 50000)
  const thumbnailUrl = row.thumbnailUrl.trim() || null
  const approvedAt = row.approvedAt.trim()
  const approvedDate = approvedAt ? new Date(/^[0-9]{4}-[0-9]{2}-[0-9]{2} /.test(approvedAt) ? `${approvedAt.replace(' ', 'T')}+09:00` : approvedAt) : null

  if (!externalId || !title || !BBS_CATEGORIES.has(category) || !content || !approvedDate || Number.isNaN(approvedDate.getTime())) {
    return { error: '원본 URL 등록에 필요한 제목·카테고리·본문·승인일시를 확인해 주세요.' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('bbs_articles')
    .select('id')
    .eq('external_id', externalId)
    .maybeSingle()
  if (existingError) return { error: '기존 기사 중복 여부를 확인하지 못했습니다.' }
  if (existing) return { error: '이미 등록된 원본 ID입니다.' }

  let reporterId: string | undefined
  if (row.reporterCharacterId && UUID_PATTERN.test(row.reporterCharacterId)) {
    const { data: reporter } = await supabase.from('characters').select('id').eq('id', row.reporterCharacterId).maybeSingle()
    reporterId = reporter?.id
  } else if (row.reporterName.trim()) {
    const { data: reporter } = await supabase.from('characters').select('id').eq('name', row.reporterName.trim()).maybeSingle()
    reporterId = reporter?.id
  }
  if (!reporterId) return { error: '담당기자를 확인하지 못했습니다.' }

  const { data: article, error } = await supabase.from('bbs_articles').insert({
    title: title.slice(0, 200),
    category,
    summary: null,
    content,
    thumbnail_url: thumbnailUrl,
    approved_at: approvedDate.toISOString(),
    is_published: false,
    reporter_character_id: reporterId,
    source: 'ingame',
    external_id: externalId,
  }).select('id').single()
  if (error || !article) {
    console.error('BBS original URL fallback create failed:', error?.code, error?.message)
    return { error: '원본 URL 기사로 등록하지 못했습니다.' }
  }

  revalidateBbsAdmin()
  return { success: true, id: article.id }
}

export async function toggleBbsArticlePublished(id: string, current: boolean): Promise<ActionResult> {
  const articleId = id.trim()
  if (!UUID_PATTERN.test(articleId)) return { error: '변경할 기사를 찾을 수 없습니다.' }

  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('bbs_articles')
    .update({ is_published: !current })
    .eq('id', articleId)
  if (error) {
    console.error('BBS article publish toggle failed:', error.code, error.message)
    return { error: '기사 공개 상태를 변경하지 못했습니다.' }
  }

  revalidateBbsList()
  revalidateBbsNeighbors()
  revalidateBbsArticle(articleId)
  return { success: true }
}

export async function deleteBbsArticle(id: string): Promise<ActionResult> {
  const articleId = id.trim()
  if (!UUID_PATTERN.test(articleId)) return { error: '삭제할 기사를 찾을 수 없습니다.' }

  const supabase = await requireAdmin()
  const [{ data: article }, { data: media }] = await Promise.all([
    supabase.from('bbs_articles').select('content, thumbnail_url').eq('id', articleId).maybeSingle(),
    supabase.from('bbs_article_media').select('image_url').eq('article_id', articleId),
  ])
  const { error } = await supabase.from('bbs_articles').delete().eq('id', articleId)
  if (error) {
    console.error('BBS article delete failed:', error.code, error.message)
    return { error: '기사를 삭제하지 못했습니다.' }
  }

  await removeStoragePaths(supabase, [...getArticleStoragePaths(article?.content ?? '', article?.thumbnail_url ?? null, (media ?? []).map((item) => item.image_url))])
  revalidateBbsList()
  revalidateBbsNeighbors()
  revalidateBbsArticle(articleId)
  return { success: true }
}

export async function createBbsComment(input: BbsCommentInput): Promise<ActionResult> {
  const articleId = input.articleId.trim()
  const authorCharacterId = input.authorCharacterId.trim()
  const content = input.content.trim()

  if (!UUID_PATTERN.test(articleId)) return { error: '댓글을 등록할 기사를 찾을 수 없습니다.' }
  if (!UUID_PATTERN.test(authorCharacterId)) return { error: '댓글 작성 캐릭터를 선택해 주세요.' }
  if (!content) return { error: '댓글 내용을 입력해 주세요.' }
  if (content.length > 1000) return { error: '댓글은 1,000자 이내로 입력해 주세요.' }
  let createdAt = new Date().toISOString()
  if (input.createdAt?.trim()) {
    const parsedDate = new Date(input.createdAt)
    if (Number.isNaN(parsedDate.getTime())) return { error: '댓글 작성 시간을 올바르게 입력해 주세요.' }
    createdAt = parsedDate.toISOString()
  }

  const supabase = await requireAdmin()
  const [{ data: article, error: articleError }, { data: character, error: characterError }] = await Promise.all([
    supabase.from('bbs_articles').select('id').eq('id', articleId).maybeSingle(),
    supabase.from('characters').select('id, name').eq('id', authorCharacterId).maybeSingle(),
  ])

  if (articleError || !article) return { error: '댓글을 등록할 기사를 찾을 수 없습니다.' }
  if (characterError || !character) return { error: '댓글 작성 캐릭터를 확인하지 못했습니다.' }

  const { error } = await supabase.from('bbs_article_comments').insert({
    article_id: articleId,
    author_character_id: character.id,
    author_name: character.name,
    content,
    created_at: createdAt,
  })
  if (error) {
    console.error('BBS comment create failed:', error.code, error.message)
    return { error: '댓글을 등록하지 못했습니다.' }
  }

  revalidateBbsAdmin()
  revalidateBbsArticle(articleId)
  return { success: true }
}

export async function updateBbsComment(id: string, input: BbsCommentUpdateInput): Promise<ActionResult> {
  const commentId = id.trim()
  const authorCharacterId = input.authorCharacterId.trim()
  const content = input.content.trim()
  if (!UUID_PATTERN.test(commentId)) return { error: '수정할 댓글을 찾을 수 없습니다.' }
  if (!UUID_PATTERN.test(authorCharacterId)) return { error: '댓글 작성 캐릭터를 선택해 주세요.' }
  if (!content) return { error: '댓글 내용을 입력해 주세요.' }
  if (content.length > 1000) return { error: '댓글은 1,000자 이내로 입력해 주세요.' }
  let createdAt: string | undefined
  if (input.createdAt?.trim()) {
    const parsedDate = new Date(input.createdAt)
    if (Number.isNaN(parsedDate.getTime())) return { error: '댓글 작성 시간을 올바르게 입력해 주세요.' }
    createdAt = parsedDate.toISOString()
  }

  const supabase = await requireAdmin()
  const [{ data: comment, error: commentError }, { data: character, error: characterError }] = await Promise.all([
    supabase.from('bbs_article_comments').select('id, article_id').eq('id', commentId).maybeSingle(),
    supabase.from('characters').select('id, name').eq('id', authorCharacterId).maybeSingle(),
  ])
  if (commentError || !comment) return { error: '수정할 댓글을 찾을 수 없습니다.' }
  if (characterError || !character) return { error: '댓글 작성 캐릭터를 확인하지 못했습니다.' }

  const updateData: { author_character_id: string; author_name: string; content: string; created_at?: string } = {
    author_character_id: character.id,
    author_name: character.name,
    content,
  }
  if (createdAt) updateData.created_at = createdAt
  const { error } = await supabase.from('bbs_article_comments').update(updateData).eq('id', commentId)
  if (error) {
    console.error('BBS comment update failed:', error.code, error.message)
    return { error: '댓글을 수정하지 못했습니다.' }
  }

  revalidateBbsAdmin()
  revalidateBbsArticle(comment.article_id)
  return { success: true }
}

export async function deleteBbsComment(id: string): Promise<ActionResult> {
  const commentId = id.trim()
  if (!UUID_PATTERN.test(commentId)) return { error: '삭제할 댓글을 찾을 수 없습니다.' }

  const supabase = await requireAdmin()
  const { data: comment, error: commentLookupError } = await supabase.from('bbs_article_comments').select('article_id').eq('id', commentId).maybeSingle()
  if (commentLookupError || !comment) return { error: '삭제할 댓글을 찾을 수 없습니다.' }
  const { error } = await supabase.from('bbs_article_comments').delete().eq('id', commentId)
  if (error) {
    console.error('BBS comment delete failed:', error.code, error.message)
    return { error: '댓글을 삭제하지 못했습니다.' }
  }

  revalidateBbsAdmin()
  revalidateBbsArticle(comment.article_id)
  return { success: true }
}
