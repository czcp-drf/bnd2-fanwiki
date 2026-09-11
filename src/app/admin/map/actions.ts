'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

// ── 조직 거점 ──────────────────────────────────────────

export async function updateOrgHq(
  id: string,
  data: { hq_x: number | null; hq_y: number | null; hq_label: string | null }
) {
  const supabase = await requireAdmin()
  await supabase.from('organizations').update(data).eq('id', id)
  revalidatePath('/admin/map')
  revalidatePath('/map')
}

// ── 작업 위치 ──────────────────────────────────────────

export async function addMapLocation(data: {
  name: string
  label: string | null
  description: string | null
  color: string
  x: number
  y: number
}) {
  const supabase = await requireAdmin()
  await supabase.from('map_locations').insert(data)
  revalidatePath('/admin/map')
  revalidatePath('/map')
}

export async function updateMapLocation(
  id: string,
  data: { name?: string; label?: string | null; description?: string | null; color?: string; x?: number | null; y?: number | null }
) {
  const supabase = await requireAdmin()
  await supabase.from('map_locations').update(data).eq('id', id)
  revalidatePath('/admin/map')
  revalidatePath('/map')
}

export async function deleteMapLocation(id: string) {
  const supabase = await requireAdmin()
  await supabase.from('map_locations').delete().eq('id', id)
  revalidatePath('/admin/map')
  revalidatePath('/map')
}
