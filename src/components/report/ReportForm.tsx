'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { submitReport, type ReportFormState } from '@/app/report/actions'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertCircle, Send, MapPin, X, Plus, Search } from 'lucide-react'
import { useRedPill } from '@/lib/context/RedPillContext'

const MapPinPicker = dynamic(() => import('./MapPinPicker'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-800" />,
})

export type StreamerOption = { id: string; display_name: string }
export type CharacterOption = { id: string; name: string; streamer_name: string | null }

// ── 스트리머 드롭다운 검색 ──────────────────────────────

function StreamerSelector({ streamers, resetKey }: { streamers: StreamerOption[]; resetKey: number }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<StreamerOption | null>(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // resetKey 변경 시 상태 초기화
  useEffect(() => { setSelected(null); setSearch(''); setOpen(false) }, [resetKey])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = streamers.filter(s =>
    s.display_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        <div className="flex items-center gap-2">
          <input type="hidden" name="streamer_report" value={selected.display_name} />
          <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm text-amber-400">
            {selected.display_name}
            <button type="button" onClick={() => setSelected(null)} className="cursor-pointer hover:text-amber-300 transition-colors">
              <X size={11} />
            </button>
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <Search size={14} className="shrink-0 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="스트리머 이름 검색"
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          {open && filtered.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
              <div className="max-h-48 overflow-y-auto">
                {filtered.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSelected(s); setSearch(''); setOpen(false) }}
                    className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    {s.display_name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {open && filtered.length === 0 && search && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
              <p className="px-4 py-3 text-sm text-zinc-600">검색 결과가 없습니다.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── 캐릭터 복수 선택 ────────────────────────────────────

function CharacterMultiSelect({ characters, resetKey }: { characters: CharacterOption[]; resetKey: number }) {
  const { isRedPill } = useRedPill()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CharacterOption[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setSelected([]); setSearch(''); setOpen(false) }, [resetKey])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function getLabel(c: CharacterOption) {
    return isRedPill && c.streamer_name ? `${c.name} (${c.streamer_name})` : c.name
  }

  const filtered = characters
    .filter(c => !selected.find(s => s.id === c.id))
    .filter(c => getLabel(c).toLowerCase().includes(search.toLowerCase()))

  function add(c: CharacterOption) {
    setSelected(prev => [...prev, c])
    setSearch('')
    setOpen(false)
  }

  function remove(id: string) {
    setSelected(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(c => (
            <span key={c.id} className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-400">
              <input type="hidden" name="character_report" value={getLabel(c)} />
              {getLabel(c)}
              <button type="button" onClick={() => remove(c.id)} className="cursor-pointer hover:text-amber-300 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <Search size={14} className="shrink-0 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={isRedPill ? '캐릭터 또는 스트리머 이름 검색' : '캐릭터 이름 검색'}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
          <Plus size={14} className="shrink-0 text-zinc-600" />
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
            <div className="max-h-48 overflow-y-auto">
              {filtered.slice(0, 30).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => add(c)}
                  className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  {getLabel(c)}
                </button>
              ))}
            </div>
          </div>
        )}
        {open && filtered.length === 0 && search && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
            <p className="px-4 py-3 text-sm text-zinc-600">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 클립 URL 다중 입력 ──────────────────────────────────

function ClipUrlsInput({ resetKey }: { resetKey: number }) {
  const [clips, setClips] = useState([''])

  useEffect(() => { setClips(['']) }, [resetKey])

  return (
    <div className="space-y-2">
      {clips.map((clip, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            name="clip_report"
            type="url"
            value={clip}
            onChange={e => setClips(prev => prev.map((c, j) => j === i ? e.target.value : c))}
            placeholder={`클립 링크 ${clips.length > 1 ? i + 1 : ''}`}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none transition-colors"
          />
          {clips.length > 1 && (
            <button
              type="button"
              onClick={() => setClips(prev => prev.filter((_, j) => j !== i))}
              className="cursor-pointer text-zinc-600 transition-colors hover:text-red-400"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
      {clips.length < 5 && (
        <button
          type="button"
          onClick={() => setClips(prev => [...prev, ''])}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-amber-400"
        >
          <Plus size={12} />
          클립 추가 (최대 5개)
        </button>
      )}
    </div>
  )
}

// ── 메인 폼 ─────────────────────────────────────────────

const typeOptions = [
  { value: 'new_character', label: '새 캐릭터 정보', desc: '위키에 없는 캐릭터 추가 요청' },
  { value: 'new_event', label: '새 사건 제보', desc: '아카이브에 없는 사건 제보' },
  { value: 'correction', label: '정보 수정', desc: '잘못된 정보 수정 요청' },
  { value: 'other', label: '기타', desc: '그 외 문의 및 제보' },
]

const initialState: ReportFormState = { status: 'idle' }

export default function ReportForm({
  streamers,
  characters,
}: {
  streamers: StreamerOption[]
  characters: CharacterOption[]
}) {
  const [state, action, isPending] = useActionState(submitReport, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedType, setSelectedType] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset()
      setShowMap(false)
      setMapCoords(null)
      setResetKey(k => k + 1)
      // selectedType 유지 — 같은 유형으로 연속 제보 가능
    }
  }, [state])

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {/* 허니팟 */}
      <input type="text" name="_hp" defaultValue="" aria-hidden="true" tabIndex={-1} style={{ position: 'absolute', left: '-9999px' }} />

      {/* 유형 선택 */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-zinc-300">
          제보 유형 <span className="text-red-400">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {typeOptions.map((opt) => (
            <label
              key={opt.value}
              className="group relative flex cursor-pointer gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors has-[:checked]:border-amber-400/50 has-[:checked]:bg-amber-400/5"
            >
              <input
                type="radio"
                name="type"
                value={opt.value}
                required
                checked={selectedType === opt.value}
                onChange={() => setSelectedType(opt.value)}
                className="peer sr-only"
              />
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-600 peer-checked:border-amber-400 peer-checked:bg-amber-400 transition-colors">
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-900 opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200 group-has-[:checked]:text-amber-400 transition-colors">
                  {opt.label}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 제목 */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-semibold text-zinc-300">
          제목 <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="제보 내용을 한 줄로 요약해주세요"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none transition-colors"
        />
      </div>

      {/* 내용 */}
      <div className="space-y-1.5">
        <label htmlFor="content" className="text-sm font-semibold text-zinc-300">
          내용 <span className="text-red-400">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          required
          maxLength={2000}
          rows={6}
          placeholder={`최대한 자세히 작성해주세요.\n관련 링크가 여러 개라면 이곳에 함께 작성해주세요.\n\n예) 캐릭터 이름, 담당 스트리머, 직업, 소속 조직 등`}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none transition-colors"
        />
        <p className="text-xs text-zinc-600 text-right">최대 2000자</p>
      </div>

      {/* 새 캐릭터 — 담당 스트리머 선택 */}
      {selectedType === 'new_character' && streamers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-zinc-300">
            빨간약{' '}
            <span className="font-normal text-zinc-600">(선택)</span>
          </p>
          <StreamerSelector streamers={streamers} resetKey={resetKey} />
        </div>
      )}

      {/* 새 사건 — 참여 인물 + 클립 */}
      {selectedType === 'new_event' && (
        <>
          {characters.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-zinc-300">
                참여 인물{' '}
                <span className="font-normal text-zinc-600">(선택, 복수 선택 가능)</span>
              </p>
              <CharacterMultiSelect characters={characters} resetKey={resetKey} />
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-zinc-300">
              클립 링크{' '}
              <span className="font-normal text-zinc-600">(선택, 최대 5개)</span>
            </p>
            <ClipUrlsInput resetKey={resetKey} />
          </div>
        </>
      )}

      {/* 지도 위치 첨부 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-300">
            지도 위치 첨부{' '}
            <span className="font-normal text-zinc-600">(선택)</span>
          </p>
          {!showMap ? (
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-amber-400/40 hover:text-amber-400"
            >
              <MapPin size={12} />
              위치 첨부하기
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setShowMap(false); setMapCoords(null) }}
              className="flex cursor-pointer items-center gap-1 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
            >
              <X size={12} />
              닫기
            </button>
          )}
        </div>

        {showMap && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              지도를 클릭해 위치를 찍어주세요. 조직 거점, 작업 위치 등을 정확하게 알려주실 수 있습니다.
            </p>
            <div className="h-64 overflow-hidden rounded-xl border border-zinc-800">
              <MapPinPicker coords={mapCoords} onPick={(lat, lng) => setMapCoords({ lat, lng })} />
            </div>
            {mapCoords ? (
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1 text-xs text-amber-400">
                  <MapPin size={10} />
                  X: {mapCoords.lng.toFixed(1)}, Y: {mapCoords.lat.toFixed(1)}
                </p>
                <button
                  type="button"
                  onClick={() => setMapCoords(null)}
                  className="cursor-pointer text-xs text-zinc-600 transition-colors hover:text-zinc-400"
                >
                  핀 제거
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">아직 위치가 선택되지 않았습니다.</p>
            )}
          </div>
        )}

        {mapCoords && (
          <>
            <input type="hidden" name="map_x" value={mapCoords.lng.toFixed(4)} />
            <input type="hidden" name="map_y" value={mapCoords.lat.toFixed(4)} />
          </>
        )}
      </div>

      {/* 참고 URL */}
      <div className="space-y-1.5">
        <label htmlFor="reference_url" className="text-sm font-semibold text-zinc-300">
          참고 링크 <span className="text-zinc-600 font-normal">(선택)</span>
        </label>
        <input
          id="reference_url"
          name="reference_url"
          type="url"
          placeholder="관련 방송 클립, 영상 링크 등"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none transition-colors"
        />
      </div>

      {/* 연락처 */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-300">
          연락처 <span className="text-zinc-600 font-normal">(선택) — 추가 확인이 필요할 때 연락드립니다</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="contact_method" className="text-xs font-medium text-zinc-500">연락 방법</label>
            <input
              id="contact_method"
              name="contact_method"
              type="text"
              placeholder="예: 디스코드, 트위터, 이메일"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contact" className="text-xs font-medium text-zinc-500">연락처</label>
            <input
              id="contact"
              name="contact"
              type="text"
              placeholder="예: username#1234"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 결과 메시지 */}
      {state.status === 'success' && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <CheckCircle size={16} className="shrink-0 text-green-400" />
          <p className="text-sm text-green-400">
            제보가 접수됐습니다. 검토 후 반영하겠습니다. 감사합니다!
          </p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{state.message}</p>
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
          isPending
            ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
            : 'bg-amber-400 text-zinc-900 hover:bg-amber-300'
        )}
      >
        <Send size={15} />
        {isPending ? '제출 중...' : '제보 제출하기'}
      </button>
    </form>
  )
}
