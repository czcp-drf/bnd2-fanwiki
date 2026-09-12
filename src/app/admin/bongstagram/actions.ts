'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { getStoryExpiration } from '@/lib/bongstagram/story-schedule'

type ProfileInput = {
  characterId: string
  profileName: string
  avatarUrl: string
  bio: string
}

type ActionResult = { success?: true; error?: string }

const BONGSTAGRAM_MEDIA_BUCKET = 'bongstagram-media'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const ALLOWED_UPLOADS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
  ['video/mp4', 'mp4'],
  ['video/webm', 'webm'],
  ['video/quicktime', 'mov'],
])

type UploadUrlResult = {
  path?: string
  token?: string
  publicUrl?: string
  error?: string
}

type ValidatedProfileInput = {
  characterId: string
  profileName: string
  avatarUrl: string | null
  bio: string | null
}

function validateProfileInput(data: ProfileInput): { error: string } | { data: ValidatedProfileInput } {
  const characterId = data.characterId.trim()
  const profileName = data.profileName.trim()
  const avatarUrl = data.avatarUrl.trim()
  const bio = data.bio.trim()

  if (!characterId) return { error: '연결할 캐릭터를 선택해 주세요.' }
  if (!profileName) return { error: '프로필 이름을 입력해 주세요.' }
  if (profileName.length > 40) return { error: '프로필 이름은 40자 이내로 입력해 주세요.' }
  if (bio.length > 150) return { error: '소개글은 150자 이내로 입력해 주세요.' }
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    return { error: '프로필 이미지 주소는 http 또는 https URL이어야 합니다.' }
  }

  return { data: { characterId, profileName, avatarUrl: avatarUrl || null, bio: bio || null } }
}

function revalidateBongstagram() {
  revalidatePath('/admin/bongstagram')
  revalidatePath('/bongstagram')
}

export async function upsertBongstagramProfile(data: ProfileInput): Promise<ActionResult> {
  const input = validateProfileInput(data)
  if ('error' in input) return input
  const profile = input.data

  const supabase = await requireAdmin()
  const { data: character, error: characterError } = await supabase
    .from('characters')
    .select('id')
    .eq('id', profile.characterId)
    .maybeSingle()

  if (characterError) {
    console.error('Bongstagram character lookup failed:', characterError.code, characterError.message)
    return { error: '캐릭터를 확인하지 못했습니다. 목록을 새로고침해 주세요.' }
  }
  if (!character) return { error: '선택한 캐릭터가 존재하지 않습니다.' }

  const { error } = await supabase
    .from('bongstagram_profiles')
    .upsert({
      character_id: profile.characterId,
      profile_name: profile.profileName,
      avatar_url: profile.avatarUrl,
      bio: profile.bio,
    }, { onConflict: 'character_id' })

  if (error) {
    console.error('Bongstagram profile save failed:', error.code, error.message)
    if (error.code === 'PGRST205') return { error: 'Bongstagram 테이블이 아직 연결되지 않았습니다. migration 019 적용을 확인해 주세요.' }
    if (error.code === '23503') return { error: '선택한 캐릭터가 존재하지 않습니다.' }
    return { error: '프로필을 저장하지 못했습니다. 입력값을 확인해 주세요.' }
  }

  revalidateBongstagram()
  return { success: true }
}

export async function deleteBongstagramProfile(characterId: string): Promise<ActionResult> {
  const id = characterId.trim()
  if (!id) return { error: '삭제할 프로필을 찾을 수 없습니다.' }

  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('bongstagram_profiles')
    .delete()
    .eq('character_id', id)

  if (error) {
    console.error('Bongstagram profile delete failed:', error.code, error.message)
    return { error: '프로필을 삭제하지 못했습니다.' }
  }

  revalidateBongstagram()
  return { success: true }
}

type PostInput = {
  characterId: string
  postType: 'post' | 'story'
  media: { mediaType: 'image' | 'video'; mediaUrl: string; storagePath?: string | null }[]
  content: string
  postedAt: string
}

type ValidatedPostInput = {
  characterId: string
  postType: 'post' | 'story'
  media: { mediaType: 'image' | 'video'; mediaUrl: string; storagePath: string | null }[]
  content: string
  postedAt: string
  storyExpiresAt: string | null
}

function validatePostInput(data: PostInput): { error: string } | { data: ValidatedPostInput } {
  const characterId = data.characterId.trim()
  const postType = data.postType
  const media = data.media
    .map((item) => ({
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl.trim(),
      storagePath: item.storagePath?.trim() || null,
    }))
    .filter((item) => item.mediaUrl)
  const content = data.content.trim()
  const postedAt = data.postedAt.trim()

  if (!characterId) return { error: '작성할 캐릭터를 선택해 주세요.' }
  if (postType !== 'post' && postType !== 'story') return { error: '게시물 타입을 선택해 주세요.' }
  if (!content && !media.length) return { error: '본문 또는 미디어 주소를 입력해 주세요.' }
  if (media.length > 10) return { error: '미디어는 게시물당 10개까지 등록할 수 있습니다.' }
  if (content.length > 2200) return { error: '본문은 2200자 이내로 입력해 주세요.' }
  if (media.some((item) => item.mediaType !== 'image' && item.mediaType !== 'video')) {
    return { error: '미디어 타입이 올바르지 않습니다.' }
  }
  if (media.some((item) => !/^https?:\/\//i.test(item.mediaUrl))) {
    return { error: '미디어 주소는 http 또는 https URL이어야 합니다.' }
  }
  if (media.some((item) => item.storagePath && !/^posts\/[a-f0-9-]+\/[a-f0-9-]+\.(jpg|png|webp|gif|avif|mp4|webm|mov)$/i.test(item.storagePath))) {
    return { error: 'Storage 미디어 경로가 올바르지 않습니다.' }
  }

  const date = postedAt ? new Date(postedAt) : new Date()
  if (Number.isNaN(date.getTime())) return { error: '게시일을 올바르게 입력해 주세요.' }

  return {
    data: {
      characterId,
      postType,
      media,
      content,
      postedAt: date.toISOString(),
      storyExpiresAt: postType === 'story'
        ? getStoryExpiration(date).toISOString()
        : null,
    },
  }
}

export async function createBongstagramUploadUrl(data: {
  fileName: string
  contentType: string
  size: number
}): Promise<UploadUrlResult> {
  const contentType = data.contentType.trim().toLowerCase()
  const extension = ALLOWED_UPLOADS.get(contentType)
  const size = Number(data.size)
  const fileName = data.fileName.trim()

  if (!extension) return { error: '지원하지 않는 파일 형식입니다. JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM만 업로드할 수 있습니다.' }
  if (!fileName || fileName.length > 255) return { error: '파일 이름을 확인해 주세요.' }
  if (!Number.isFinite(size) || size <= 0) return { error: '파일 크기를 확인할 수 없습니다.' }
  if (size > (contentType.startsWith('video/') ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE)) {
    return { error: contentType.startsWith('video/') ? '동영상은 100MB 이하만 업로드할 수 있습니다.' : '이미지는 10MB 이하만 업로드할 수 있습니다.' }
  }

  const supabase = await requireAdmin()
  const path = `posts/${crypto.randomUUID()}/${crypto.randomUUID()}.${extension}`
  const { data: signedUpload, error } = await supabase.storage
    .from(BONGSTAGRAM_MEDIA_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !signedUpload) {
    console.error('Bongstagram upload URL create failed:', error?.message)
    return { error: 'Storage 업로드 주소를 만들지 못했습니다. bongstagram-media 버킷과 migration 022를 확인해 주세요.' }
  }

  const { data: publicData } = supabase.storage.from(BONGSTAGRAM_MEDIA_BUCKET).getPublicUrl(path)
  return { path, token: signedUpload.token, publicUrl: publicData.publicUrl }
}

export async function deleteBongstagramUploadedMedia(paths: string[]): Promise<ActionResult> {
  const validPaths = paths.filter((path) => /^posts\/[a-f0-9-]+\/[a-f0-9-]+\.(jpg|png|webp|gif|avif|mp4|webm|mov)$/i.test(path))
  if (!validPaths.length) return { success: true }

  const supabase = await requireAdmin()
  const { error } = await supabase.storage.from(BONGSTAGRAM_MEDIA_BUCKET).remove(validPaths)
  if (error) {
    console.error('Bongstagram uploaded media cleanup failed:', error.message)
    return { error: '업로드된 파일을 정리하지 못했습니다.' }
  }
  return { success: true }
}

async function validatePostCharacter(characterId: string) {
  const supabase = await requireAdmin()
  const { data: profile, error } = await supabase
    .from('bongstagram_profiles')
    .select('character_id')
    .eq('character_id', characterId)
    .maybeSingle()

  if (error) {
    console.error('Bongstagram post profile lookup failed:', error.code, error.message)
    return { supabase, error: error.code === 'PGRST205'
      ? 'Bongstagram 프로필 테이블이 아직 연결되지 않았습니다. migration 019 적용을 확인해 주세요.'
      : 'Bongstagram 프로필을 확인하지 못했습니다.' }
  }
  if (!profile) return { supabase, error: '먼저 해당 캐릭터의 Bongstagram 프로필을 등록해 주세요.' }
  return { supabase }
}

async function savePostMedia(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  postId: string,
  media: ValidatedPostInput['media'],
) {
  const { data: oldMedia, error: oldMediaError } = await supabase
    .from('bongstagram_post_media')
    .select('storage_path')
    .eq('post_id', postId)
  if (oldMediaError) return oldMediaError

  const { error: deleteError } = await supabase
    .from('bongstagram_post_media')
    .delete()
    .eq('post_id', postId)
  if (deleteError) return deleteError

  const error = media.length
    ? (await supabase
      .from('bongstagram_post_media')
      .insert(media.map((item, index) => ({
        post_id: postId,
        media_type: item.mediaType,
        media_url: item.mediaUrl,
        storage_path: item.storagePath,
        sort_order: index,
      })))).error
    : null
  if (!error) {
    const newPaths = new Set(media.map((item) => item.storagePath).filter((path): path is string => Boolean(path)))
    const oldPaths = oldMedia.map((item) => item.storage_path).filter((path): path is string => Boolean(path))
    const pathsToRemove = oldPaths.filter((path) => !newPaths.has(path))
    if (pathsToRemove.length) {
      const { error: cleanupError } = await supabase.storage.from(BONGSTAGRAM_MEDIA_BUCKET).remove(pathsToRemove)
      if (cleanupError) console.error('Bongstagram old media cleanup failed:', cleanupError.message)
    }
  }
  return error
}

export async function createBongstagramPost(data: PostInput): Promise<ActionResult> {
  const input = validatePostInput(data)
  if ('error' in input) return input

  const { supabase, error: profileError } = await validatePostCharacter(input.data.characterId)
  if (profileError) return { error: profileError }

  const { data: post, error } = await supabase
    .from('bongstagram_posts')
    .insert({
      character_id: input.data.characterId,
      post_type: input.data.postType,
      content: input.data.content,
      posted_at: input.data.postedAt,
      story_expires_at: input.data.storyExpiresAt,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Bongstagram post create failed:', error.code, error.message)
    if (error.code === 'PGRST205') return { error: 'Bongstagram 게시물 테이블이 아직 연결되지 않았습니다. migration 020 적용을 확인해 주세요.' }
    return { error: '게시물을 등록하지 못했습니다. 입력값을 확인해 주세요.' }
  }

  const mediaError = await savePostMedia(supabase, post.id, input.data.media)
  if (mediaError) {
    await supabase.from('bongstagram_posts').delete().eq('id', post.id)
    const uploadedPaths = input.data.media.map((item) => item.storagePath).filter((path): path is string => Boolean(path))
    if (uploadedPaths.length) await supabase.storage.from(BONGSTAGRAM_MEDIA_BUCKET).remove(uploadedPaths)
    console.error('Bongstagram post media create failed:', mediaError.code, mediaError.message)
    if (mediaError.code === 'PGRST205') return { error: 'Bongstagram 미디어 테이블이 아직 연결되지 않았습니다. migration 021 적용을 확인해 주세요.' }
    return { error: '게시물 미디어를 등록하지 못했습니다.' }
  }

  revalidateBongstagram()
  return { success: true }
}

export async function updateBongstagramPost(id: string, data: PostInput): Promise<ActionResult> {
  const postId = id.trim()
  if (!postId) return { error: '수정할 게시물을 찾을 수 없습니다.' }

  const input = validatePostInput(data)
  if ('error' in input) return input

  const { supabase, error: profileError } = await validatePostCharacter(input.data.characterId)
  if (profileError) return { error: profileError }

  const { error } = await supabase
    .from('bongstagram_posts')
    .update({
      character_id: input.data.characterId,
      post_type: input.data.postType,
      content: input.data.content,
      posted_at: input.data.postedAt,
      story_expires_at: input.data.storyExpiresAt,
    })
    .eq('id', postId)

  if (error) {
    console.error('Bongstagram post update failed:', error.code, error.message)
    if (error.code === 'PGRST205') return { error: 'Bongstagram 게시물 테이블이 아직 연결되지 않았습니다. migration 020 적용을 확인해 주세요.' }
    return { error: '게시물을 수정하지 못했습니다. 입력값을 확인해 주세요.' }
  }

  const mediaError = await savePostMedia(supabase, postId, input.data.media)
  if (mediaError) {
    console.error('Bongstagram post media update failed:', mediaError.code, mediaError.message)
    if (mediaError.code === 'PGRST205') return { error: 'Bongstagram 미디어 테이블이 아직 연결되지 않았습니다. migration 021 적용을 확인해 주세요.' }
    return { error: '게시물 미디어를 수정하지 못했습니다.' }
  }

  revalidateBongstagram()
  return { success: true }
}

export async function deleteBongstagramPost(id: string): Promise<ActionResult> {
  const postId = id.trim()
  if (!postId) return { error: '삭제할 게시물을 찾을 수 없습니다.' }

  const supabase = await requireAdmin()
  const { data: media } = await supabase
    .from('bongstagram_post_media')
    .select('storage_path')
    .eq('post_id', postId)

  const { error } = await supabase
    .from('bongstagram_posts')
    .delete()
    .eq('id', postId)

  if (error) {
    console.error('Bongstagram post delete failed:', error.code, error.message)
    if (error.code === 'PGRST205') return { error: 'Bongstagram 게시물 테이블이 아직 연결되지 않았습니다. migration 020 적용을 확인해 주세요.' }
    return { error: '게시물을 삭제하지 못했습니다.' }
  }

  const paths = (media ?? []).map((item) => item.storage_path).filter((path): path is string => Boolean(path))
  if (paths.length) {
    const { error: cleanupError } = await supabase.storage.from(BONGSTAGRAM_MEDIA_BUCKET).remove(paths)
    if (cleanupError) console.error('Bongstagram deleted media cleanup failed:', cleanupError.message)
  }

  revalidateBongstagram()
  return { success: true }
}
