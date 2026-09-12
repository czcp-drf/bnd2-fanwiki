import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadOgFonts, OG_SIZE } from '@/lib/og'

export const size = OG_SIZE
export const contentType = 'image/png'

const categoryLabel: Record<string, string> = {
  gang: '갱단', public_service: '공무직', city_hall: '시청',
  business: '사업체', illegal: '불법 사업체', other: '기타',
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: rawOrg }, { count: memberCount }] = await Promise.all([
    supabase
      .from('organizations')
      .select('name, name_confirmed, color, category, description, is_disbanded')
      .eq('id', id)
      .single(),
    supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .is('left_at', null),
  ])

  type OrgData = {
    name: string | null; name_confirmed: boolean; color: string | null
    category: string | null; description: string | null; is_disbanded: boolean
  }
  const org = rawOrg as unknown as OrgData | null

  const name = org?.name_confirmed ? (org?.name ?? '알 수 없음') : '미정'
  const color = org?.color ?? '#f59e0b'
  const category = org?.category ?? 'other'
  const description = org?.description
    ? (org.description.length > 80 ? org.description.slice(0, 80) + '…' : org.description)
    : null
  const isDisbanded = org?.is_disbanded ?? false
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
          background: `radial-gradient(ellipse at top left, ${color}14 0%, transparent 55%)`,
        }} />
        {/* 우측 컬러 바 */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 8, height: '100%',
          backgroundColor: color, opacity: 0.6,
        }} />

        {/* 사이트명 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <span style={{ color: '#f59e0b', fontSize: 22, fontWeight: 700 }}>봉누도2 위키</span>
          <span style={{ color: '#3f3f46', fontSize: 22 }}>·</span>
          <span style={{ color: '#71717a', fontSize: 22 }}>조직</span>
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '20px', zIndex: 1 }}>
          {/* 카테고리 배지 */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              backgroundColor: `${color}18`, border: `1px solid ${color}40`,
              color: color, borderRadius: '20px', padding: '5px 18px', fontSize: 20,
            }}>
              {categoryLabel[category] ?? category}
            </div>
            {isDisbanded && (
              <div style={{
                backgroundColor: '#7f1d1d', border: '1px solid #991b1b',
                color: '#fca5a5', borderRadius: '20px', padding: '5px 18px', fontSize: 20,
              }}>
                해산
              </div>
            )}
          </div>

          {/* 조직명 */}
          <div style={{
            fontSize: name.length > 12 ? 56 : 72,
            fontWeight: 700, color: '#ffffff', lineHeight: 1.1,
          }}>
            {name}
          </div>

          {/* 설명 (JS로 truncate) */}
          {description && (
            <div style={{ fontSize: 22, color: '#71717a', maxWidth: '900px' }}>
              {description}
            </div>
          )}

          {/* 멤버 수 */}
          <div style={{ fontSize: 22, color: '#52525b' }}>
            현재 멤버 {memberCount ?? 0}명
          </div>
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
