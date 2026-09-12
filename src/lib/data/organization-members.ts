type Membership = {
  left_at: string | null
  sort_order: number
  characters: { status: string } | null
}

export function groupOrganizationMembers<T extends Membership>(members: T[]) {
  const active: T[] = []
  const inactive: T[] = []
  const former: T[] = []
  for (const member of members) {
    if (!member.characters) continue
    if (member.left_at !== null) former.push(member)
    else if (member.characters.status === 'active') active.push(member)
    else inactive.push(member)
  }
  for (const group of [active, inactive, former]) {
    group.sort((a, b) => a.sort_order - b.sort_order)
  }
  return { active, inactive, former }
}
