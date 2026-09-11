import { createClient } from '@/lib/supabase/server'

export type OrganizationFilterOption = {
  id: string
  name: string
  color: string | null
  category: string | null
}

export async function getOrganizationFilterOptions(): Promise<OrganizationFilterOption[]> {
  const supabase = await createClient()
  const [{ data: organizations }, { data: businesses }] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, color, category')
      .eq('is_active', true)
      .neq('category', 'illegal')
      .order('name'),
    supabase
      .from('organizations')
      .select('name, gang_id')
      .eq('category', 'illegal')
      .eq('is_disbanded', false)
      .not('gang_id', 'is', null),
  ])

  const gangBusinessNames = new Map(
    ((businesses ?? []) as Array<{ name: string; gang_id: string }>).map((business) => [
      business.gang_id,
      business.name,
    ])
  )

  return ((organizations ?? []) as OrganizationFilterOption[]).map((organization) => ({
    ...organization,
    name: organization.category === 'gang'
      ? `${organization.name}${gangBusinessNames.has(organization.id) ? ` - ${gangBusinessNames.get(organization.id)}` : ''}`
      : organization.name,
  }))
}
