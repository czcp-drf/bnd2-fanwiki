'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { BBS_ARTICLES_TAG } from '@/lib/bbs/data'

const BBS_MEDIA_BUCKET = 'bbs-media'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_MEDIA_COUNT = 5
const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
])
const BBS_CATEGORIES = new Set(['info', 'incident', 'economy', 'column', 'other'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STORAGE_PATH_PATTERN = /^articles\/[0-9a-f-]+\/[0-9a-f-]+\.(jpg|png|webp|gif|avif)$/i

type ActionResult = { success?: true; id?: string; error?: string }

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

function validateUrl(value: string, label: string) {
  if (!/^https?:\/\//i.test(value)) return `${label}는 http 또는 https URL이어야 합니다.`
  try {
    new URL(value)
    return null
  } catch {
    return `${label} 주소를 확인해 주세요.`
  }
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

  if (!title) return { error: '기사 제목을 입력해 주세요.' }
  if (title.length > 200) return { error: '기사 제목은 200자 이내로 입력해 주세요.' }
  if (!BBS_CATEGORIES.has(category)) return { error: '기사 말머리를 선택해 주세요.' }
  if (summary.length > 500) return { error: '기사 요약은 500자 이내로 입력해 주세요.' }
  if (content.length > 50000) return { error: '기사 본문은 50,000자 이내로 입력해 주세요.' }
  if (!UUID_PATTERN.test(reporterCharacterId)) return { error: '담당기자를 선택해 주세요.' }
  if (thumbnailUrl) {
    const error = validateUrl(thumbnailUrl, '대표 이미지 주소')
    if (error) return { error }
  }
  if (media.length > MAX_MEDIA_COUNT) return { error: `기사 이미지는 최대 ${MAX_MEDIA_COUNT}장까지 등록할 수 있습니다.` }
  for (const item of media) {
    const error = validateUrl(item.imageUrl, '첨부 이미지 주소')
    if (error) return { error }
    if (item.storagePath && !STORAGE_PATH_PATTERN.test(item.storagePath)) return { error: 'Storage 이미지 경로가 올바르지 않습니다.' }
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
      thumbnailUrl: thumbnailUrl || null,
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
    return STORAGE_PATH_PATTERN.test(path) ? path : null
  } catch {
    return null
  }
}

async function removeStoragePaths(supabase: Awaited<ReturnType<typeof requireAdmin>>, paths: string[]) {
  const validPaths = [...new Set(paths)].filter((path) => STORAGE_PATH_PATTERN.test(path))
  if (!validPaths.length) return
  const { error } = await supabase.storage.from(BBS_MEDIA_BUCKET).remove(validPaths)
  if (error) console.error('BBS storage cleanup failed:', error.message)
}

function revalidateBbs(articleId?: string) {
  revalidatePath('/admin/bbs')
  revalidatePath('/bbs')
  revalidatePath('/api/bbs/latest')
  updateTag(BBS_ARTICLES_TAG)
  if (articleId) revalidatePath(`/bbs/article/${articleId}`)
}

export async function refreshBbsCache(): Promise<ActionResult> {
  await requireAdmin()
  revalidatePath('/admin/bbs')
  revalidatePath('/bbs')
  revalidatePath('/api/bbs/latest')
  updateTag(BBS_ARTICLES_TAG)
  return { success: true }
}

export async function createBbsUploadUrl(data: { fileName: string; contentType: string; size: number }) {
  const contentType = data.contentType.trim().toLowerCase()
  const extension = ALLOWED_IMAGE_TYPES.get(contentType)
  const fileName = data.fileName.trim()
  const size = Number(data.size)

  if (!extension) return { error: '지원하지 않는 이미지 형식입니다. JPG, PNG, WEBP, GIF, AVIF만 업로드할 수 있습니다.' }
  if (!fileName || fileName.length > 255) return { error: '파일 이름을 확인해 주세요.' }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_SIZE) return { error: '이미지는 10MB 이하만 업로드할 수 있습니다.' }

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
  await removeStoragePaths(supabase, oldPaths.filter((path) => !newPaths.has(path) && !referencedPaths.has(path)))
  return { error: null, oldPaths: [] as string[] }
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

  revalidateBbs(article.id)
  return { success: true, id: article.id }
}

export async function updateBbsArticle(id: string, input: BbsArticleInput): Promise<ActionResult> {
  const articleId = id.trim()
  if (!UUID_PATTERN.test(articleId)) return { error: '수정할 기사를 찾을 수 없습니다.' }
  const validated = validateArticleInput(input)
  if ('error' in validated) return validated

  const supabase = await requireAdmin()
  const { data: reporter, error: reporterError } = await supabase
    .from('characters')
    .select('id')
    .eq('id', validated.data.reporterCharacterId)
    .maybeSingle()
  if (reporterError || !reporter) return { error: '담당기자를 확인하지 못했습니다.' }

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

  revalidateBbs(articleId)
  return { success: true }
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

  revalidateBbs(articleId)
  return { success: true }
}

export async function deleteBbsArticle(id: string): Promise<ActionResult> {
  const articleId = id.trim()
  if (!UUID_PATTERN.test(articleId)) return { error: '삭제할 기사를 찾을 수 없습니다.' }

  const supabase = await requireAdmin()
  const { data: media } = await supabase.from('bbs_article_media').select('image_url').eq('article_id', articleId)
  const { error } = await supabase.from('bbs_articles').delete().eq('id', articleId)
  if (error) {
    console.error('BBS article delete failed:', error.code, error.message)
    return { error: '기사를 삭제하지 못했습니다.' }
  }

  await removeStoragePaths(supabase, (media ?? []).map((item) => extractStoragePath(item.image_url)).filter((path): path is string => Boolean(path)))
  revalidateBbs(articleId)
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

  revalidateBbs(articleId)
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

  revalidateBbs(comment.article_id)
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

  revalidateBbs(comment.article_id)
  return { success: true }
}
