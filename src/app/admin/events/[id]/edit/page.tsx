import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import EventForm from '../../EventForm'
import ParticipantsEditor from '../ParticipantsEditor'
import ClipsEditor from '../ClipsEditor'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

async function getData(id: string) {
  const supabase = createAdminClient()

  const [{ data: event }, { data: participants }, { data: clips }, { data: characters }, { data: streamers }] =
    await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('event_participants').select('id, role, characters(id, name)').eq('event_id', id),
      supabase.from('event_clips').select('id, clip_url, label, sort_order, streamers(display_name)').eq('event_id', id).order('sort_order'),
      supabase.from('characters').select('id, name, streamers(id, display_name)').order('name'),
      supabase.from('streamers').select('id, display_name').order('display_name'),
    ])

  return { event, participants: participants ?? [], clips: clips ?? [], characters: characters ?? [], streamers: streamers ?? [] }
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params
  const { event, participants, clips, characters, streamers } = await getData(id)
  if (!event) notFound()

  type CharRow = { id: string; name: string; streamers: { id: string; display_name: string } | null }
  const charRows = characters as unknown as CharRow[]
  const charList = charRows.map((c) => ({
    id: c.id,
    name: c.name,
    streamer_display_name: c.streamers?.display_name ?? '',
  }))
  const characterRefs = charRows
    .filter((c) => c.streamers?.id)
    .map((c) => ({ name: c.name, streamer_id: c.streamers!.id }))

  type ClipRow = { id: string; clip_url: string; label: string | null; sort_order: number; streamers: { display_name: string } | null }
  type ParticipantRow = { id: string; role: string | null; characters: { id: string; name: string } | null }

  return (
    <div className="p-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/admin/events" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">{event.title}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">사건 편집</p>
        </div>
        {event.is_published && (
          <Link href={`/events/${id}`} target="_blank" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-400 transition-colors">
            <ExternalLink size={13} />
            공개 페이지
          </Link>
        )}
      </div>

      {/* 2열 레이아웃 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        {/* 왼쪽: 기본 정보 */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">기본 정보</h2>
          <EventForm
            initial={{
              id: event.id,
              title: event.title,
              summary: event.summary ?? '',
              content: event.content ?? '',
              type: event.type,
              occurred_at: event.occurred_at ? event.occurred_at.slice(0, 16) : '',
              thumbnail_url: event.thumbnail_url ?? '',
              is_published: event.is_published,
            }}
          />
        </section>

        {/* 오른쪽: 참여 캐릭터 + 관련 클립 */}
        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white">참여 캐릭터</h2>
            <ParticipantsEditor
              eventId={id}
              participants={participants as unknown as ParticipantRow[]}
              characters={charList}
            />
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white">관련 클립</h2>
            <ClipsEditor
              eventId={id}
              clips={clips as unknown as ClipRow[]}
              streamers={streamers as { id: string; display_name: string }[]}
              characterRefs={characterRefs}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
