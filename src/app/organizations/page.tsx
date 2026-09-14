export const revalidate = 86400

import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { WIKI_CACHE_REVALIDATE, WIKI_CACHE_TAGS, WIKI_PUBLIC_TAG } from '@/lib/cache/wiki'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import type { Organization } from '@/types/database'
import AppImage from '@/components/ui/AppImage'

export const metadata: Metadata = {
  title: '조직',
  description: '봉누도2 서버의 갱단, 공무직, 사업체, 불법 사업체 조직 정보',
}

const typeLabel: Record<string, string> = {
  police:               '경찰',
  ems:                  'EMS',
  journalist:           '기자',
  traffic:              '교통정비',
  city_hall:            '시청',
  restaurant_chinese:   '중식당',
  restaurant_japanese:  '일식당',
  restaurant_western:   '양식당',
  restaurant_cafe:      '카페',
  tuning:               '튜닝소',
  farming:              '농업',
  fishing:              '어업',
  information_dealer:   '정보상',
  gunsmith:             '총기 제작',
  money_laundering:     '자금 세탁',
  smuggling:            '밀수',
  black_market:         '블랙마켓',
  illegal_medical:      '불법 의료',
  illegal_tuning:       '불법 튜닝',
  other:                '기타',
}

const categories = [
  {
    key: 'city_hall' as const,
    label: '시청',
    desc: '서버 운영을 총괄하는 최상위 기관',
    badge: 'text-indigo-400 bg-indigo-400/10',
    dot: 'bg-indigo-400',
  },
  {
    key: 'public_service' as const,
    label: '공무직',
    desc: '서버 내 공공 기관 및 공무 단체',
    badge: 'text-blue-400 bg-blue-400/10',
    dot: 'bg-blue-400',
  },
  {
    key: 'gang' as const,
    label: '갱단',
    desc: '서버 내 활동하는 범죄 조직',
    badge: 'text-orange-400 bg-orange-400/10',
    dot: 'bg-orange-400',
  },
  {
    key: 'business' as const,
    label: '사업체',
    desc: '합법적으로 운영되는 민간 사업체',
    badge: 'text-emerald-400 bg-emerald-400/10',
    dot: 'bg-emerald-400',
  },
]

type OrgRow = Organization & { member_count: number; gang_id: string | null; is_disbanded: boolean }

async function getOrganizations() {
  const supabase = createPublicClient()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('*, gang_id, is_disbanded')
    .order('category')
    .order('name')

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')
    .is('left_at', null)

  const countMap: Record<string, number> = {}
  for (const m of (members ?? []) as { organization_id: string }[]) {
    countMap[m.organization_id] = (countMap[m.organization_id] ?? 0) + 1
  }

  return ((orgs ?? []) as OrgRow[]).map((o) => ({
    ...o,
    member_count: countMap[o.id] ?? 0,
  }))
}

const getOrganizationsCached = unstable_cache(getOrganizations, ['wiki-organizations-list'], {
  revalidate: WIKI_CACHE_REVALIDATE,
  tags: [WIKI_PUBLIC_TAG, WIKI_CACHE_TAGS.organizations, WIKI_CACHE_TAGS.characters],
})

export default async function OrganizationsPage() {
  const orgs = await getOrganizationsCached()

  // 해체된 조직은 제외 (활성/비활성 모두 표시하되 해체만 숨김)
  const activeOrgs = orgs.filter((o) => !o.is_disbanded)

  const grouped: Record<string, OrgRow[]> = {
    city_hall: activeOrgs.filter((o) => o.category === 'city_hall'),
    public_service: activeOrgs.filter((o) => o.category === 'public_service'),
    gang: activeOrgs.filter((o) => o.category === 'gang'),
    business: activeOrgs.filter((o) => o.category === 'business'),
  }

  // 갱단별 운영 사업체 맵
  const gangBusinessMap: Record<string, OrgRow[]> = {}
  for (const org of activeOrgs.filter((o) => o.category === 'illegal' && o.gang_id)) {
    const gid = org.gang_id!
    if (!gangBusinessMap[gid]) gangBusinessMap[gid] = []
    gangBusinessMap[gid].push(org)
  }

  return (
    <div className="wiki-theme min-h-[calc(100vh-3.5rem)] px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">조직</h1>
          <p className="text-sm text-zinc-500">봉누도2 서버에 존재하는 조직과 사업체 목록입니다.</p>
        </div>

        {categories.map(({ key, label, desc, badge, dot }) => {
        const list = grouped[key] ?? []
        if (key !== 'city_hall' && key !== 'public_service' && list.length === 0) return null

        return (
          <section key={key} className="space-y-5">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${dot}`} />
              <div>
                <h2 className="text-base font-bold text-white">{label}</h2>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
              <span className={`ml-auto text-xs font-medium rounded-full px-2.5 py-0.5 ${badge}`}>
                {list.length}개
              </span>
            </div>

            {list.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center text-sm text-zinc-600">
                등록된 조직이 없습니다.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((org) => (
                  <OrgCard
                    key={org.id}
                    org={org}
                    badge={badge}
                    businesses={key === 'gang' ? (gangBusinessMap[org.id] ?? []) : []}
                  />
                ))}
              </div>
            )}
          </section>
        )
        })}
      </div>
    </div>
  )
}

function OrgCard({
  org,
  badge,
  businesses,
}: {
  org: OrgRow
  badge: string
  businesses: OrgRow[]
}) {
  return (
    <Link
      href={`/organizations/${org.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
      style={org.color ? { borderColor: `${org.color}25` } : {}}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-sm font-black"
          style={{ backgroundColor: `${org.color ?? '#52525b'}30`, color: org.color ?? '#a1a1aa' }}
        >
          {org.logo_url ? (
            <AppImage src={org.logo_url} alt={org.name} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            (org.name_confirmed ? org.name : typeLabel[org.type ?? ''] ?? '?').charAt(0)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-white group-hover:text-amber-400 transition-colors truncate">
              {org.name_confirmed ? org.name : <span className="text-zinc-400">{typeLabel[org.type ?? ''] ?? '미정'}</span>}
            </p>
            {!org.name_confirmed && (
              <span className="shrink-0 rounded-full bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">
                미정
              </span>
            )}
          </div>
          {org.type && (
            <p className={`text-xs font-medium mt-0.5 ${badge} inline-block rounded-full px-1.5 py-0.5`}>
              {typeLabel[org.type] ?? '기타'}
            </p>
          )}
        </div>
      </div>

      {org.description && (
        <p className="text-xs text-zinc-500 line-clamp-2">{org.description}</p>
      )}

      {/* 갱단 운영 사업체 목록 */}
      {businesses.length > 0 && (
        <div className="border-t border-zinc-800 pt-2.5 space-y-1.5">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">운영 사업체</p>
          {businesses.map((b) => {
            const bizName = b.name_confirmed ? b.name : (typeLabel[b.type ?? ''] ?? null)
            const bizType = b.name_confirmed && b.type ? typeLabel[b.type] : null
            return (
              <div key={b.id} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-sm shrink-0 rotate-45"
                  style={{ backgroundColor: b.color ?? '#71717a' }}
                />
                <span className="text-xs text-zinc-400 truncate">
                  {bizName ?? <span className="text-zinc-600">미정</span>}
                </span>
                {bizType && (
                  <span className="ml-auto shrink-0 text-[10px] text-zinc-600">
                    {bizType}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-auto">
        <Users size={11} />
        <span>멤버 {org.member_count}명</span>
      </div>
    </Link>
  )
}
