export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import MemberManageClient, { type MemberRow, type CharOption } from './MemberManageClient'

type Props = { params: Promise<{ id: string }> }

async function getData(id: string) {
  const supabase = createAdminClient()

  const [{ data: org }, { data: members }, { data: allChars }] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, name_confirmed, color, category')
      .eq('id', id)
      .single(),

    supabase
      .from('organization_members')
      .select(`
        character_id, role, is_primary, joined_at, left_at, sort_order,
        characters ( id, name, status, streamers ( display_name ) )
      `)
      .eq('organization_id', id)
      .order('left_at', { ascending: true, nullsFirst: true })
      .order('sort_order', { ascending: true }),

    supabase
      .from('characters')
      .select('id, name, job, streamers ( display_name )')
      .order('name'),
  ])

  if (!org) return null

  type RawMember = {
    character_id: string
    role: string | null
    is_primary: boolean
    joined_at: string | null
    left_at: string | null
    sort_order: number
    characters: {
      id: string
      name: string
      status: string
      streamers: { display_name: string } | null
    } | null
  }

  type RawChar = {
    id: string
    name: string
    job: string | null
    streamers: { display_name: string } | null
  }

  const memberRows: MemberRow[] = ((members ?? []) as unknown as RawMember[]).map((m) => ({
    character_id: m.character_id,
    character_name: m.characters?.name ?? '?',
    character_status: m.characters?.status ?? 'active',
    streamer_name: m.characters?.streamers?.display_name ?? null,
    role: m.role,
    is_primary: m.is_primary,
    joined_at: m.joined_at,
    left_at: m.left_at,
    sort_order: m.sort_order,
  }))

  const memberCharIds = new Set(memberRows.map((m) => m.character_id))

  const charOptions: CharOption[] = ((allChars ?? []) as unknown as RawChar[])
    .filter((c) => !memberCharIds.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      job: c.job,
      streamer_name: c.streamers?.display_name ?? null,
    }))

  return { org, memberRows, charOptions }
}

export default async function OrgMembersPage({ params }: Props) {
  const { id } = await params
  const data = await getData(id)
  if (!data) notFound()

  const { org, memberRows, charOptions } = data
  const orgName = org.name_confirmed ? org.name : '미정'
  const activeCount = memberRows.filter((m) => !m.left_at).length

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/organizations"
          className="text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ChevronLeft size={20} />
        </Link>
        <div
          className="h-4 w-4 rounded-sm shrink-0"
          style={{ backgroundColor: org.color ?? '#52525b' }}
        />
        <div>
          <h1 className="text-xl font-black text-white">{orgName} — 멤버 관리</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            현재 멤버 {activeCount}명 · 멤버 추가·역할 편집·퇴장 처리
          </p>
        </div>
      </div>

      <MemberManageClient orgId={id} members={memberRows} characters={charOptions} />
    </div>
  )
}
