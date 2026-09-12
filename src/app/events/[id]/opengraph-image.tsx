import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadOgFonts, OG_SIZE } from '@/lib/og'

export const size = OG_SIZE
export const contentType = 'image/png'

const typeLabel: Record<string, string> = {
  war: '전쟁', crime: '범죄', political: '정치',
  social: '사회', accident: '사고', other: '기타',
}
const typeColor: Record<string, string> = {
  war: '#f87171', crime: '#fb923c', political: '#60a5fa',
  social: '#4ade80', accident: '#facc15', other: '#71717a',
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: raw } = await supabase
    .from('events')
    .select('title, type, occurred_at, summary')
    .eq('id', id)
    .single()

  type EventData = {
    title: string; type: string | null
    occurred_at: string | null; summary: string | null
  }
  const data = raw as unknown as EventData | null

  const title = data?.title ?? '알 수 없음'
  const type = data?.type ?? 'other'
  const summary = data?.summary
    ? (data.summary.length > 100 ? data.summary.slice(0, 100) + '…' : data.summary)
    : null
  const occurredAt = data?.occurred_at
    ? new Date(data.occurred_at).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null
  const color = typeColor[type] ?? '#71717a'
  const fonts = await loadOgFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          backgroundColor: '#09090b',
          display: 'flex', flexDirection: 'column',
          padding: '56px 64px',
          fontFamily: fonts.length ? 'NotoKR' : 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 배경 그라디언트 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(ellipse at bottom right, ${color}10 0%, transparent 60%)`,
        }} />

        {/* 사이트명 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <span style={{ color: '#f59e0b', fontSize: 22, fontWeight: 700 }}>봉누도2 위키</span>
          <span style={{ color: '#3f3f46', fontSize: 22 }}>·</span>
          <span style={{ color: '#71717a', fontSize: 22 }}>사건</span>
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '24px', zIndex: 1 }}>
          {/* 타입 배지 + 날짜 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              backgroundColor: `${color}18`, border: `1px solid ${color}40`,
              color: color, borderRadius: '20px', padding: '5px 20px', fontSize: 20,
            }}>
              {typeLabel[type] ?? type}
            </div>
            {occurredAt && (
              <span style={{ color: '#52525b', fontSize: 20 }}>{occurredAt}</span>
            )}
          </div>

          {/* 제목 */}
          <div style={{
            fontSize: title.length > 20 ? 48 : title.length > 14 ? 56 : 64,
            fontWeight: 700, color: '#ffffff', lineHeight: 1.2, maxWidth: '1000px',
          }}>
            {title}
          </div>

          {/* 요약 (JS로 truncate) */}
          {summary && (
            <div style={{ fontSize: 22, color: '#71717a', lineHeight: 1.6, maxWidth: '900px' }}>
              {summary}
            </div>
          )}
        </div>

        {/* URL */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', zIndex: 1 }}>
          <span style={{ color: '#3f3f46', fontSize: 18 }}>bnd2-fanwiki.vercel.app</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  )
}
