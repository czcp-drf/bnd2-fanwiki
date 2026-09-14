export const revalidate = 86400

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import type { Streamer } from '@/types/database'
import { StreamerReveal } from '@/components/ui/StreamerMask'
import AppImage from '@/components/ui/AppImage'
import BackButton from '@/components/ui/BackButton'

type Props = { params: Promise<{ id: string }> }

type OrgMember = {
  character_id: string
  role: string | null
  is_primary: boolean
  organizations: { id: string; name: string; type: string; color: string | null } | null
}

type StreamerDetail = Streamer & {
  characters: Array<{
    id: string
    name: string
    alias: string[] | null
    job: string | null
    description: string | null
    status: string
    first_appeared: string | null
    organization_members: Array<Omit<OrgMember, 'character_id'>>
  }>
}

async function getStreamer(id: string): Promise<StreamerDetail | null> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('streamers')
    .select(`
      *,
      characters ( id, name, alias, job, description, status, first_appeared )
    `)
    .eq('id', id)
    .single()

  if (!data) return null

  type RawStreamer = Omit<StreamerDetail, 'characters'> & {
    characters: Array<Omit<StreamerDetail['characters'][0], 'organization_members'>>
  }
  const streamer = data as unknown as RawStreamer
  const charIds = streamer.characters.map((c) => c.id)

  const { data: memberships } = charIds.length
    ? await supabase
        .from('organization_members')
        .select('character_id, role, is_primary, organizations ( id, name, type, color )')
        .in('character_id', charIds)
        .is('left_at', null)
    : { data: [] }

  const byCharId = new Map<string, Array<Omit<OrgMember, 'character_id'>>>()
  for (const m of (memberships ?? []) as unknown as OrgMember[]) {
    const list = byCharId.get(m.character_id) ?? []
    list.push({ role: m.role, is_primary: m.is_primary, organizations: m.organizations })
    byCharId.set(m.character_id, list)
  }

  return {
    ...streamer,
    characters: streamer.characters.map((c) => ({
      ...c,
      organization_members: byCharId.get(c.id) ?? [],
    })),
  } as StreamerDetail
}

const getStreamerCached = unstable_cache(getStreamer, ['wiki-streamer-detail'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.streamers, WIKI_CACHE_TAGS.characters, WIKI_CACHE_TAGS.organizations],
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const streamer = await getStreamerCached(id)
  if (!streamer) return {}
  return {
    title: streamer.display_name,
    description: `${streamer.display_name}의 봉누도2 RP 캐릭터 정보`,
    openGraph: {
      title: streamer.display_name,
      description: `${streamer.display_name}의 봉누도2 RP 캐릭터 정보`,
      ...(streamer.profile_image_url ? { images: [streamer.profile_image_url] } : {}),
    },
  }
}

const statusLabel: Record<string, string> = {
  active: '활동',
  dead: '사망',
  retired: '은퇴',
  hiatus: '휴식',
}

const statusColor: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10 border-green-400/20',
  dead: 'text-red-400 bg-red-400/10 border-red-400/20',
  retired: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  hiatus: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
}

export default async function StreamerDetailPage({ params }: Props) {
  const { id } = await params
  const streamer = await getStreamerCached(id)

  if (!streamer) notFound()

  const characters = streamer.characters ?? []

  return (
    <div className="wiki-theme min-h-[calc(100vh-3.5rem)] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
      {/* 뒤로가기 */}
      <BackButton />

      {/* 프로필 */}
      <div className="flex flex-col gap-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:flex-row sm:items-center">
        {streamer.profile_image_url ? (
          <AppImage
            src={streamer.profile_image_url}
            alt={streamer.display_name}
            className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-zinc-700"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-3xl font-black text-zinc-400">
            {streamer.display_name.charAt(0)}
          </div>
        )}
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-white">{streamer.display_name}</h1>
            {!streamer.is_active && (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-500">
                비활동
              </span>
            )}
          </div>
          <a
            href={`https://chzzk.naver.com/${streamer.chzzk_channel_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-amber-400/40 hover:text-amber-400 transition-colors"
          >
            <ExternalLink size={12} />
            치지직 채널 바로가기
          </a>
        </div>
        <StreamerReveal>
          <div className="text-right text-sm text-zinc-500">
            캐릭터 <span className="text-white font-bold">{characters.length}</span>개
          </div>
        </StreamerReveal>
      </div>

      {/* 캐릭터 목록 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">RP 캐릭터</h2>

        <StreamerReveal
          fallback={
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center text-zinc-500 text-sm">
              빨간약을 먹으면 캐릭터 정보를 볼 수 있습니다.
            </div>
          }
        >
        {characters.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center text-zinc-500 text-sm">
            등록된 캐릭터가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {characters.map((c) => {
              const orgs = c.organization_members
                .filter((m) => m.organizations)
                .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

              return (
                <Link
                  key={c.id}
                  href={`/characters/${c.id}`}
                  className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-amber-400/40 hover:bg-zinc-800/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                          {c.name}
                        </span>
                        {c.alias && c.alias.length > 0 && (
                          <span className="text-xs text-zinc-500">
                            ({c.alias.join(', ')})
                          </span>
                        )}
                      </div>
                      {c.job && <p className="text-sm text-zinc-400">{c.job}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor[c.status]}`}>
                      {statusLabel[c.status]}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-sm text-zinc-500 line-clamp-2">{c.description}</p>
                  )}

                  {orgs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {orgs.map((m, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400"
                          style={
                            m.organizations?.color
                              ? { borderColor: `${m.organizations.color}40`, color: m.organizations.color }
                              : {}
                          }
                        >
                          {m.organizations?.name}
                          {m.role && ` · ${m.role}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {c.first_appeared && (
                    <p className="text-xs text-zinc-600">
                      첫 등장 {new Date(c.first_appeared).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
        </StreamerReveal>
      </section>
      </div>
    </div>
  )
}
