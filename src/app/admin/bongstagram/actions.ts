'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'

type ProfileInput = {
  characterId: string
  profileName: string
  avatarUrl: string
  bio: string
}

type ActionResult = { success?: true; error?: string }

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
