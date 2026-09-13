'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'
import { invalidateWikiCache } from '@/lib/cache/wiki'

function invalidateAndRevalidate(path: string, type?: 'page' | 'layout') {
  invalidateWikiCache()
  if (type) revalidatePath(path, type)
  else revalidatePath(path)
}

export async function addRelationship(data: {
  character_a_id: string
  character_b_id: string
  type: string
  description: string | null
}) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('character_relationships').insert(data)
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/relationships')
  return { success: true }
}

export async function updateRelationship(id: string, data: {
  type: string
  description: string | null
}) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('character_relationships').update(data).eq('id', id)
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/relationships')
  return { success: true }
}

export async function deleteRelationship(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('character_relationships').delete().eq('id', id)
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/relationships')
  return { success: true }
}
