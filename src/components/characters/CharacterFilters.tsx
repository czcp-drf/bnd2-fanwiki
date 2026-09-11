'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import Select, { type SelectOption } from '@/components/ui/Select'

const sortOptions: SelectOption[] = [
  { value: 'name', label: '이름순' },
  { value: 'name_desc', label: '이름 역순' },
  { value: 'latest', label: '최신 등록순' },
  { value: 'oldest', label: '오래된 순' },
]

const statusOptions = [
  { value: '', label: '전체' },
  { value: 'active', label: '활동' },
  { value: 'dead', label: '사망' },
  { value: 'retired', label: '은퇴' },
  { value: 'hiatus', label: '휴식' },
]

const categoryLabel: Record<string, string> = {
  city_hall: '시청',
  public_service: '공무직',
  gang: '갱단',
  business: '사업체',
}

const categoryOrder = ['city_hall', 'public_service', 'gang', 'business']

type Organization = { id: string; name: string; color: string | null; category: string | null }

export default function CharacterFilters({
  organizations,
  basePath = '/characters',
  showStatus = true,
}: {
  organizations: Organization[]
  basePath?: string
  showStatus?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const status = searchParams.get('status') ?? ''
  const org = searchParams.get('org') ?? ''
  const sort = searchParams.get('sort') ?? 'name'

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      const query = params.toString()
      const targetPath = pathname.startsWith('/live') ? '/live' : basePath
      router.push(`${targetPath}${query ? `?${query}` : ''}`, { scroll: false })
    },
    [basePath, pathname, router, searchParams]
  )

  // 카테고리별 그룹핑
  const grouped: Record<string, Organization[]> = {}
  for (const o of organizations) {
    const cat = o.category ?? 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(o)
  }

  const orgOptions: SelectOption[] = [
    { value: '', label: '전체 조직' },
    { value: '__none__', label: '무소속' },
  ]

  for (const cat of categoryOrder) {
    const list = grouped[cat]
    if (!list?.length) continue
    orgOptions.push({ separator: true, label: categoryLabel[cat] ?? cat })
    for (const o of list) {
      orgOptions.push({ value: o.id, label: o.name })
    }
  }

  // categoryOrder에 없는 카테고리 처리
  for (const cat of Object.keys(grouped)) {
    if (categoryOrder.includes(cat)) continue
    const list = grouped[cat]
    if (!list?.length) continue
    orgOptions.push({ separator: true, label: cat })
    for (const o of list) {
      orgOptions.push({ value: o.id, label: o.name })
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* 상태 필터 */}
      {showStatus && <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update('status', opt.value)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              status === opt.value
                ? 'bg-amber-400 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>}

      {/* 조직 필터 */}
      {organizations.length > 0 && (
        <Select
          value={org}
          onChange={(v) => update('org', v)}
          options={orgOptions}
        />
      )}

      {/* 정렬 */}
      <Select
        value={sort}
        onChange={(v) => update('sort', v)}
        options={sortOptions}
      />
    </div>
  )
}
