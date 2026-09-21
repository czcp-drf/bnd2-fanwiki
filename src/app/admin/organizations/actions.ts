'use server'

import { isMapColor } from '@/lib/map/color'
import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'
import { invalidateWikiCache } from '@/lib/cache/wiki'

function normalizeEmoji(value: string | null | undefined): { value: string | null; error?: never } | { value?: never; error: string } {
  const emoji = value?.trim() || null
  if (emoji && [...emoji].length > 16) return { error: '대표 이모지는 16자 이내로 입력해주세요.' }
  return { value: emoji }
}

function invalidateAndRevalidate(path: string, type?: 'page' | 'layout') {
  invalidateWikiCache()
  if (type) revalidatePath(path, type)
  else revalidatePath(path)
}

export async function createOrganization(data: {
  name: string
  name_confirmed: boolean
  category: string
  description: string | null
  color: string | null
  emoji: string | null
  is_active: boolean
}) {
  const supabase = await requireAdmin()
  if (data.color !== null && !isMapColor(data.color)) return { error: '색상은 #RRGGBB 형식으로 입력해주세요.' }
  const emoji = normalizeEmoji(data.emoji)
  if (emoji.error) return { error: emoji.error }
  const { error } = await supabase.from('organizations').insert({ ...data, emoji: emoji.value })
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/organizations')
  invalidateAndRevalidate('/organizations')
  return { success: true }
}

export async function deleteOrganization(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('organizations').delete().eq('id', id)
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/organizations')
  invalidateAndRevalidate('/admin/map')
  invalidateAndRevalidate('/organizations')
  invalidateAndRevalidate('/map')
  return { success: true }
}

export async function updateOrganization(id: string, data: {
  name: string
  name_confirmed: boolean
  description: string | null
  color: string | null
  emoji: string | null
  is_active: boolean
  is_disbanded: boolean
  gang_id: string | null
}) {
  const supabase = await requireAdmin()
  if (data.color !== null && !isMapColor(data.color)) return { error: '색상은 #RRGGBB 형식으로 입력해주세요.' }
  const emoji = normalizeEmoji(data.emoji)
  if (emoji.error) return { error: emoji.error }
  const { error } = await supabase.from('organizations').update({ ...data, emoji: emoji.value }).eq('id', id)
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/organizations')
  invalidateAndRevalidate('/admin/map')
  invalidateAndRevalidate('/organizations')
  invalidateAndRevalidate('/map')
  return { success: true }
}
