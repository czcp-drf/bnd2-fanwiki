import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { loadOgFonts, OG_SIZE } from '@/lib/og'

export const size = OG_SIZE
export const contentType = 'image/png'

const statusLabel: Record<string, string> = {
  active: '활동', dead: '사망', retired: '은퇴', hiatus: '휴식',
}
const statusColor: Record<string, string> = {
  active: '#4ade80', dead: '#f87171', retired: '#71717a', hiatus: '#facc15',
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('characters')
    .select(`
      name, alias, job, status, avatar_url,
      organization_members!inner(
        left_at,
        organizations(name, color)
      )
    `)
    .eq('id', id)
    .single()

  const name = data?.name ?? '알 수 없음'
  const alias = data?.alias?.[0] ?? null
  const job = data?.job ?? null
  const status = data?.status ?? 'active'
  const avatarUrl = data?.avatar_url ?? null
  const orgs = ((data?.organization_members ?? []) as any[])
    .filter((m) => !m.left_at)
    .map((m) => m.organizations)
    .filter(Boolean)
    .slice(0, 2)

  const fonts = await loadOgFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#09090b',
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 64px',
          fontFamily: 'NotoKR',
          position: 'relative',
        }}
      >
        {/* 배경 그라디언트 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at top left, rgba(245,158,11,0.08) 0%, transparent 60%)',
          }}
        />

        {/* 상단: 사이트명 + 페이지 유형 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <span style={{ color: '#f59e0b', fontSize: 22, fontWeight: 700 }}>봉누도2 위키</span>
          <span style={{ color: '#3f3f46', fontSize: 22 }}>·</span>
          <span style={{ color: '#71717a', fontSize: 22 }}>캐릭터</span>
        </div>

        {/* 메인 콘텐츠 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '52px',
            flex: 1,
            zIndex: 1,
          }}
        >
          {/* 아바타 */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              width={180}
              height={180}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #27272a',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                backgroundColor: '#18181b',
                border: '3px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 72,
                flexShrink: 0,
              }}
            >
              👤
            </div>
          )}

          {/* 텍스트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <div style={{ fontSize: 72, fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
              {name}
            </div>
            {alias && (
              <div style={{ fontSize: 26, color: '#71717a' }}>"{alias}"</div>
            )}
            {job && (
              <div style={{ fontSize: 24, color: '#a1a1aa' }}>{job}</div>
            )}

            {/* 하단 배지들 */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
              <div
                style={{
                  backgroundColor: `${statusColor[status] ?? '#71717a'}18`,
                  border: `1px solid ${statusColor[status] ?? '#71717a'}40`,
                  color: statusColor[status] ?? '#71717a',
                  borderRadius: '20px',
                  padding: '5px 18px',
                  fontSize: 18,
                }}
              >
                {statusLabel[status] ?? status}
              </div>
              {orgs.map((org: any, i: number) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: `${org.color ?? '#71717a'}18`,
                    border: `1px solid ${org.color ?? '#71717a'}40`,
                    color: org.color ?? '#a1a1aa',
                    borderRadius: '20px',
                    padding: '5px 18px',
                    fontSize: 18,
                  }}
                >
                  {org.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단: URL */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', zIndex: 1 }}>
          <span style={{ color: '#3f3f46', fontSize: 18 }}>bnd2-fanwiki.vercel.app</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  )
}
