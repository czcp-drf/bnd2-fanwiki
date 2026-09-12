'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

// ── 조직 거점 ──────────────────────────────────────────

export async function updateOrgHq(
  id: string,
  data: { hq_x: number | null; hq_y: number | null; hq_label: string | null }
) {
  const supabase = await requireAdmin()
  const { data: rows, error } = await supabase.from('organizations').update(data).eq('id', id).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  revalidatePath('/admin/map')
  revalidatePath('/map')
  return { success: true }
}

// ── 사업체 위치 ────────────────────────────────────────

export async function updateOrgBiz(
  id: string,
  data: { biz_x: number | null; biz_y: number | null; biz_label: string | null }
) {
  const supabase = await requireAdmin()
  const { data: rows, error } = await supabase.from('organizations').update(data).eq('id', id).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  revalidatePath('/admin/map')
  revalidatePath('/map')
  return { success: true }
}

// ── 주요 장소 ──────────────────────────────────────────

export async function addMapLocation(data: {
  name: string
  label: string | null
  description: string | null
  color: string
  x: number
  y: number
}) {
  const supabase = await requireAdmin()
  const { data: rows, error } = await supabase.from('map_locations').insert(data).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  revalidatePath('/admin/map')
  revalidatePath('/map')
  return { success: true }
}

export async function updateMapLocation(
  id: string,
  data: { name?: string; label?: string | null; description?: string | null; color?: string; x?: number | null; y?: number | null }
) {
  const supabase = await requireAdmin()
  const { data: rows, error } = await supabase.from('map_locations').update(data).eq('id', id).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  revalidatePath('/admin/map')
  revalidatePath('/map')
  return { success: true }
}

export async function deleteMapLocation(id: string) {
  const supabase = await requireAdmin()
  const { data: rows, error } = await supabase.from('map_locations').delete().eq('id', id).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  revalidatePath('/admin/map')
  revalidatePath('/map')
  return { success: true }
}
