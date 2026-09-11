'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Select from '@/components/ui/Select'

const sortOptions = [
  { value: 'name', label: '이름순' },
  { value: 'name_desc', label: '이름 역순' },
  { value: 'latest', label: '최신 등록순' },
  { value: 'oldest', label: '오래된 순' },
]

export default function StreamerFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sort = searchParams.get('sort') ?? 'name'

  function update(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'name') params.set('sort', value)
    else params.delete('sort')
    router.push(`/streamers?${params.toString()}`, { scroll: false })
  }

  return <Select value={sort} onChange={update} options={sortOptions} />
}
