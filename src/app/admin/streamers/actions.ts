'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

export async function addStreamer(formData: FormData) {
  const supabase = await requireAdmin()
  const getText = (key: string) => { const value = formData.get(key); return typeof value === 'string' ? value.trim() : '' }
  const chzzk_channel_id = getText('chzzk_channel_id')
  const display_name = getText('display_name')
  const profile_image_url = getText('profile_image_url') || null

  if (!/^[a-f0-9]{32}$/i.test(chzzk_channel_id) || !display_name) return { error: '이름과 32자리 치지직 채널 ID를 확인해주세요.' }

  const { data: streamer, error } = await supabase
    .from('streamers')
    .insert({ chzzk_channel_id, display_name, profile_image_url, is_active: true })
    .select('id')
    .single()

  if (error || !streamer) return { error: error?.code === '23505' ? '이미 등록된 채널 ID입니다.' : '스트리머를 추가하지 못했습니다.' }
  const { error: characterError } = await supabase.from('characters').insert({ name: '미정', streamer_id: streamer.id, status: 'active' })

  revalidatePath('/admin/streamers')
  revalidatePath('/admin/characters')
  if (characterError) return { error: '스트리머는 등록되었으나 미정 캐릭터 생성에 실패했습니다. 중복 등록하지 말고 캐릭터 관리에서 연결해주세요.' }
  return { success: true }
}

export async function updateStreamer(
  id: string,
  data: { chzzk_channel_id: string; display_name: string; profile_image_url: string | null; is_active: boolean }
) {
  const supabase = await requireAdmin()
  if (!data.display_name.trim() || !/^[a-f0-9]{32}$/i.test(data.chzzk_channel_id)) return { error: '이름과 32자리 치지직 채널 ID를 확인해주세요.' }
  const { data: rows, error } = await supabase.from('streamers').update(data).eq('id', id).select('id')
  if (error) return { error: error.code === '23505' ? '이미 등록된 채널 ID입니다.' : '스트리머를 수정하지 못했습니다.' }
  if (!rows?.length) return { error: '스트리머가 존재하지 않습니다. 목록을 새로고침해주세요.' }
  revalidatePath('/admin/streamers')
  return { success: true }
}

export async function deleteStreamer(id: string) {
  const supabase = await requireAdmin()
  const { data: rows, error } = await supabase.from('streamers').delete().eq('id', id).select('id')
  if (error) return { error: '스트리머를 삭제하지 못했습니다.' }
  if (!rows?.length) return { error: '스트리머가 존재하지 않습니다. 목록을 새로고침해주세요.' }
  revalidatePath('/admin/streamers')
  return { success: true }
}
