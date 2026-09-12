'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

function paths(orgId: string) {
  revalidatePath(`/admin/organizations/${orgId}`)
  revalidatePath('/admin/organizations')
  revalidatePath(`/organizations/${orgId}`)
  revalidatePath('/organizations')
}

export async function addOrgMembers(
  orgId: string,
  members: { characterId: string; role: string | null; isPrimary: boolean }[]
) {
  const supabase = await requireAdmin()
  const now = new Date().toISOString()
  const rows = members.map((m) => ({
    organization_id: orgId,
    character_id: m.characterId,
    role: m.role,
    is_primary: m.isPrimary,
    joined_at: now,
    left_at: null,
  }))
  const { error } = await supabase.from('organization_members').insert(rows)
  if (error) return { error: error.message }
  paths(orgId)
  return { success: true }
}

export async function updateOrgMember(
  orgId: string,
  characterId: string,
  data: { role: string | null; isPrimary: boolean }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('organization_members')
    .update({ role: data.role, is_primary: data.isPrimary })
    .eq('organization_id', orgId)
    .eq('character_id', characterId)
    .is('left_at', null)
  if (error) return { error: error.message }
  paths(orgId)
  return { success: true }
}

export async function setMembersLeft(orgId: string, characterIds: string[]) {
  if (characterIds.length === 0) return { success: true }
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('organization_members')
    .update({ left_at: new Date().toISOString() })
    .eq('organization_id', orgId)
    .in('character_id', characterIds)
    .is('left_at', null)
  if (error) return { error: error.message }
  paths(orgId)
  return { success: true }
}

export async function restoreMember(orgId: string, characterId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('organization_members')
    .update({ left_at: null })
    .eq('organization_id', orgId)
    .eq('character_id', characterId)
    .not('left_at', 'is', null)
  if (error) return { error: error.message }
  paths(orgId)
  return { success: true }
}
