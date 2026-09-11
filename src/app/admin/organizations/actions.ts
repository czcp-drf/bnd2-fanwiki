'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

export async function createOrganization(data: {
  name: string
  name_confirmed: boolean
  category: string
  description: string | null
  color: string | null
  is_active: boolean
}) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('organizations').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin/organizations')
  revalidatePath('/organizations')
  return { success: true }
}

export async function deleteOrganization(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('organizations').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/organizations')
  revalidatePath('/admin/map')
  revalidatePath('/organizations')
  revalidatePath('/map')
  return { success: true }
}

export async function updateOrganization(id: string, data: {
  name: string
  name_confirmed: boolean
  description: string | null
  color: string | null
  is_active: boolean
  is_disbanded: boolean
  gang_id: string | null
}) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('organizations').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/organizations')
  revalidatePath('/admin/map')
  revalidatePath('/organizations')
  revalidatePath('/map')
  return { success: true }
}
