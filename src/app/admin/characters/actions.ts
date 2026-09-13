'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'
import { invalidateWikiCache } from '@/lib/cache/wiki'

function invalidateAndRevalidate(path: string, type?: 'page' | 'layout') {
  invalidateWikiCache()
  if (type) revalidatePath(path, type)
  else revalidatePath(path)
}

export async function saveCharacter(id: string, data: {
  name: string; job: string | null; status: string; orgId: string | null; orgRole: string | null
}) {
  const supabase = await requireAdmin()
  if (!data.name.trim() || !['active', 'dead', 'retired', 'hiatus'].includes(data.status)) {
    return { error: '캐릭터 이름과 상태를 확인해 주세요.' }
  }
  const { error } = await supabase.rpc('save_character', {
    p_character_id: id, p_name: data.name.trim(), p_job: data.job?.trim() || null,
    p_status: data.status, p_org_id: data.orgId || null, p_role: data.orgRole?.trim() || null,
  })
  if (error) {
    console.error('Character save failed:', error.code, error.message)
    if (error.code === 'PGRST202') return { error: '저장 기능의 DB 업데이트가 필요합니다. 관리자에게 문의해 주세요.' }
    if (error.code === '23503' || error.code === 'P0002') return { error: '캐릭터 또는 소속이 존재하지 않습니다. 목록을 새로고침해 주세요.' }
    return { error: '저장하지 못했습니다. 입력값을 확인한 후 다시 시도해 주세요.' }
  }
  invalidateAndRevalidate('/', 'layout')
  return { success: true }
}

export async function createCharacter(data: {
  name: string
  streamerId: string | null
  job: string | null
  status: string
  orgId: string | null
  orgRole: string | null
}) {
  const supabase = await requireAdmin()
  if (!['active', 'dead', 'retired', 'hiatus'].includes(data.status)) {
    return { error: '올바른 상태를 선택해 주세요.' }
  }
  const { data: characterId, error } = await supabase.rpc('create_character_with_membership', {
    p_name: data.name.trim() || '미정', p_streamer_id: data.streamerId || null,
    p_job: data.job?.trim() || null, p_status: data.status,
    p_org_id: data.orgId || null, p_role: data.orgRole?.trim() || null,
  })
  if (error?.code === 'PGRST202') return { error: '생성 기능의 DB 업데이트(017)가 필요합니다.' }
  if (error?.code === '23503') return { error: '선택한 스트리머 또는 조직이 없습니다. 목록을 새로고침해주세요.' }
  if (error || !characterId) return { error: '캐릭터 생성에 실패했습니다.' }
  invalidateAndRevalidate('/', 'layout')
  return { success: true }
}

export async function renameCharacter(id: string, name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { error: '이름을 입력해 주세요.' }
  const supabase = await requireAdmin()
  const { error } = await supabase.from('characters').update({ name: trimmed }).eq('id', id)
  if (error) return { error: '저장하지 못했습니다.' }
  invalidateAndRevalidate('/', 'layout')
  return { success: true }
}
