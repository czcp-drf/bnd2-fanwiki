'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRedPill } from '@/lib/context/RedPillContext'

type Character = { id: string; name: string; streamerName: string | null }
type Org = { id: string; name: string; category: string | null }

const categoryLabel: Record<string, string> = {
  city_hall: '시청',
  public_service: '공무직',
  gang: '갱단',
  business: '사업체',
}

export default function TimelineFilters({
  characters,
  orgs,
}: {
  characters: Character[]
  orgs: Org[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isRedPill } = useRedPill()

  const currentChar = searchParams.get('character') ?? ''
  const currentOrg = searchParams.get('org') ?? ''

  const [charQuery, setCharQuery] = useState('')
  const [orgQuery, setOrgQuery] = useState('')
  const [charOpen, setCharOpen] = useState(false)
  const [orgOpen, setOrgOpen] = useState(false)
  const charRef = useRef<HTMLDivElement>(null)
  const orgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (charRef.current && !charRef.current.contains(e.target as Node)) setCharOpen(false)
      if (orgRef.current && !orgRef.current.contains(e.target as Node)) setOrgOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function navigate(params: { character?: string; org?: string }) {
    const p = new URLSearchParams()
    if (params.character) p.set('character', params.character)
    if (params.org) p.set('org', params.org)
    const qs = p.size ? `?${p.toString()}` : ''
    router.push(`/events/timeline${qs}`, { scroll: false })
  }

  const q = charQuery.trim().toLowerCase()
  const filteredChars = q
    ? characters.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(q)
        const streamerMatch = isRedPill && c.streamerName?.toLowerCase().includes(q)
        return nameMatch || streamerMatch
      })
    : characters

  const oq = orgQuery.trim().toLowerCase()
  const filteredOrgs = oq
    ? orgs.filter(o => o.name.toLowerCase().includes(oq))
    : orgs

  const selectedChar = characters.find(c => c.id === currentChar)
  const selectedOrg = orgs.find(o => o.id === currentOrg)
  const mode = currentChar ? 'character' : currentOrg ? 'org' : 'all'

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* 전체 */}
      <button
        onClick={() => navigate({})}
        className={cn(
          'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
          mode === 'all'
            ? 'bg-amber-400 text-zinc-900'
            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
        )}
      >
        전체
      </button>

      {/* 캐릭터별 */}
      <div ref={charRef} className="relative">
        {selectedChar ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-zinc-800 px-3 py-1.5">
            <span className="text-xs text-zinc-200">{selectedChar.name}</span>
            {isRedPill && selectedChar.streamerName && (
              <span className="text-xs text-zinc-500">{selectedChar.streamerName}</span>
            )}
            <button
              onClick={() => { navigate({}); setCharQuery('') }}
              className="shrink-0 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
            <input
              value={charQuery}
              onChange={e => { setCharQuery(e.target.value); setCharOpen(true) }}
              onFocus={() => setCharOpen(true)}
              placeholder="캐릭터별"
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-800 pl-7 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none transition-colors"
            />
          </div>
        )}
        {charOpen && !selectedChar && (
          <div className="absolute left-0 top-full z-50 mt-1 w-52 max-h-56 overflow-y-auto dropdown-scroll rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
            {filteredChars.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-600">검색 결과 없음</p>
            ) : (
              filteredChars.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { navigate({ character: c.id }); setCharOpen(false); setCharQuery('') }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-xs font-medium text-zinc-200">{c.name}</span>
                  {isRedPill && c.streamerName && (
                    <span className="ml-1.5 text-xs text-zinc-500">{c.streamerName}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 조직별 */}
      <div ref={orgRef} className="relative">
        {selectedOrg ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-zinc-800 px-3 py-1.5">
            <span className="text-xs text-zinc-200">{selectedOrg.name}</span>
            {selectedOrg.category && categoryLabel[selectedOrg.category] && (
              <span className="text-xs text-zinc-500">{categoryLabel[selectedOrg.category]}</span>
            )}
            <button
              onClick={() => { navigate({}); setOrgQuery('') }}
              className="shrink-0 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
            <input
              value={orgQuery}
              onChange={e => { setOrgQuery(e.target.value); setOrgOpen(true) }}
              onFocus={() => setOrgOpen(true)}
              placeholder="조직별"
              className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 pl-7 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none transition-colors"
            />
          </div>
        )}
        {orgOpen && !selectedOrg && (
          <div className="absolute left-0 top-full z-50 mt-1 w-52 max-h-56 overflow-y-auto dropdown-scroll rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
            {filteredOrgs.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-600">검색 결과 없음</p>
            ) : (
              filteredOrgs.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { navigate({ org: o.id }); setOrgOpen(false); setOrgQuery('') }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-xs font-medium text-zinc-200">{o.name}</span>
                  {o.category && categoryLabel[o.category] && (
                    <span className="ml-1.5 text-xs text-zinc-500">{categoryLabel[o.category]}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
