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

  const { data: streamer, error } = await supabase.rpc('create_streamer_with_character', {
    p_channel_id: chzzk_channel_id, p_display_name: display_name,
    p_profile_image_url: profile_image_url,
  })

  if (error?.code === 'PGRST202') return { error: '생성 기능의 DB 업데이트(017)가 필요합니다.' }
  if (error || !streamer) return { error: error?.code === '23505' ? '이미 등록된 채널 ID입니다.' : '스트리머를 추가하지 못했습니다.' }

  revalidatePath('/admin/streamers')
  revalidatePath('/admin/characters')
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
