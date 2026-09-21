'use server'

import { isMapColor } from '@/lib/map/color'
import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'
import { invalidateWikiCache } from '@/lib/cache/wiki'

function invalidateAndRevalidate(path: string, type?: 'page' | 'layout') {
  invalidateWikiCache()
  if (type) revalidatePath(path, type)
  else revalidatePath(path)
}

function validateWikiPath(value: string | null | undefined) {
  const path = value?.trim() || null
  if (path) {
    try {
      const url = new URL(path)
      if (!['http:', 'https:'].includes(url.protocol) || path.length > 2000) throw new Error('invalid wiki url')
    } catch {
      return { ok: false as const, error: '위키 링크는 http:// 또는 https://로 시작하는 외부 URL만 입력할 수 있습니다.' }
    }
  }
  return { ok: true as const, path }
}

// ── 조직 거점 ──────────────────────────────────────────

export async function updateOrgHq(
  id: string,
  data: { hq_x: number | null; hq_y: number | null; hq_label: string | null; hq_wiki_path: string | null }
) {
  const wikiPath = validateWikiPath(data.hq_wiki_path)
  if (!wikiPath.ok) return { error: wikiPath.error }
  const supabase = await requireAdmin()
  const { data: rows, error } = await supabase.from('organizations').update({ hq_x: data.hq_x, hq_y: data.hq_y, hq_label: data.hq_label, hq_wiki_path: wikiPath.path }).eq('id', id).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  invalidateAndRevalidate('/admin/map')
  invalidateAndRevalidate('/map')
  return { success: true }
}

// ── 사업체 위치 ────────────────────────────────────────

export async function updateOrgBiz(
  id: string,
  data: { biz_x: number | null; biz_y: number | null; biz_label: string | null }
) {
  const supabase = await requireAdmin()
  const { data: rows, error } = await supabase.from('organizations').update({ biz_x: data.biz_x, biz_y: data.biz_y, biz_label: data.biz_label }).eq('id', id).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  invalidateAndRevalidate('/admin/map')
  invalidateAndRevalidate('/map')
  return { success: true }
}

export async function updateOrgPinStyle(id: string, data: { pin_border_color: string | null }) {
  const supabase = await requireAdmin()
  if (data.pin_border_color !== null && !isMapColor(data.pin_border_color)) {
    return { error: '외곽선 색상은 #RRGGBB 형식으로 입력해주세요.' }
  }
  const { data: rows, error } = await supabase
    .from('organizations')
    .update({ pin_border_color: data.pin_border_color })
    .eq('id', id)
    .select('id')
  if (error) return { error: '핀 외곽선 색상을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  invalidateAndRevalidate('/admin/map')
  invalidateAndRevalidate('/map')
  return { success: true }
}

// ── 주요 장소 ──────────────────────────────────────────

export async function addMapLocation(data: {
  name: string
  label: string | null
  description: string | null
  color: string
  pin_border_color?: string | null
  x: number
  y: number
  wiki_path?: string | null
}) {
  const wikiPath = validateWikiPath(data.wiki_path)
  if (!wikiPath.ok) return { error: wikiPath.error }
  const supabase = await requireAdmin()
  if (!isMapColor(data.color)) return { error: '색상은 #RRGGBB 형식으로 입력해주세요.' }
  if (data.pin_border_color !== undefined && data.pin_border_color !== null && !isMapColor(data.pin_border_color)) {
    return { error: '외곽선 색상은 #RRGGBB 형식으로 입력해주세요.' }
  }
  const { data: rows, error } = await supabase.from('map_locations').insert({ ...data, wiki_path: wikiPath.path }).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  invalidateAndRevalidate('/admin/map')
  invalidateAndRevalidate('/map')
  return { success: true }
}

export async function updateMapLocation(
  id: string,
  data: { name?: string; label?: string | null; description?: string | null; color?: string; pin_border_color?: string | null; x?: number | null; y?: number | null; wiki_path?: string | null }
) {
  const wikiPath = validateWikiPath(data.wiki_path)
  if (!wikiPath.ok) return { error: wikiPath.error }
  const supabase = await requireAdmin()
  if (data.color !== undefined && !isMapColor(data.color)) return { error: '색상은 #RRGGBB 형식으로 입력해주세요.' }
  if (data.pin_border_color !== undefined && data.pin_border_color !== null && !isMapColor(data.pin_border_color)) {
    return { error: '외곽선 색상은 #RRGGBB 형식으로 입력해주세요.' }
  }
  const updateData = data.wiki_path === undefined ? data : { ...data, wiki_path: wikiPath.path }
  const { data: rows, error } = await supabase.from('map_locations').update(updateData).eq('id', id).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  invalidateAndRevalidate('/admin/map')
  invalidateAndRevalidate('/map')
  return { success: true }
}

export async function deleteMapLocation(id: string) {
  const supabase = await requireAdmin()
  const { data: rows, error } = await supabase.from('map_locations').delete().eq('id', id).select('id')
  if (error) return { error: '지도 변경을 저장하지 못했습니다. 다시 시도해주세요.' }
  if (!rows?.length) return { error: '변경할 대상이 없습니다. 목록을 새로고침해주세요.' }
  invalidateAndRevalidate('/admin/map')
  invalidateAndRevalidate('/map')
  return { success: true }
}
