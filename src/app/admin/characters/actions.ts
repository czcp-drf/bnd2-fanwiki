'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

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
  revalidatePath('/', 'layout')
  return { success: true }
}
