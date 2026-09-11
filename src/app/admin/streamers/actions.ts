'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

export async function addStreamer(formData: FormData) {
  const supabase = await requireAdmin()
  const chzzk_channel_id = (formData.get('chzzk_channel_id') as string).trim()
  const display_name = (formData.get('display_name') as string).trim()
  const profile_image_url = (formData.get('profile_image_url') as string).trim() || null

  if (!chzzk_channel_id || !display_name) return

  await supabase.from('streamers').insert({ chzzk_channel_id, display_name, profile_image_url, is_active: true })
  revalidatePath('/admin/streamers')
}

export async function updateStreamer(
  id: string,
  data: { chzzk_channel_id: string; display_name: string; profile_image_url: string | null; is_active: boolean }
) {
  const supabase = await requireAdmin()
  await supabase.from('streamers').update(data).eq('id', id)
  revalidatePath('/admin/streamers')
}

export async function deleteStreamer(id: string) {
  const supabase = await requireAdmin()
  await supabase.from('streamers').delete().eq('id', id)
  revalidatePath('/admin/streamers')
}
