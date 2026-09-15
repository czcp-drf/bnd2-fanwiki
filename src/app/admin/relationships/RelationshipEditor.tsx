'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Plus, Search, X, Check, Pencil, Trash2 } from 'lucide-react'
import { addRelationship, updateRelationship, deleteRelationship } from './actions'
import { handleDropdownKeyDown } from '@/lib/dropdown-keyboard'

type Character = { id: string; name: string; streamerName: string | null }

type Relationship = {
  id: string
  type: string
  description: string | null
  character_a: { id: string; name: string } | null
  character_b: { id: string; name: string } | null
}

const REL_TYPES = [
  { value: 'friend',   label: '친구',   color: 'text-blue-400 bg-blue-400/10' },
  { value: 'enemy',    label: '적',     color: 'text-red-400 bg-red-400/10' },
  { value: 'rival',    label: '라이벌', color: 'text-orange-400 bg-orange-400/10' },
  { value: 'family',   label: '가족',   color: 'text-purple-400 bg-purple-400/10' },
  { value: 'romantic', label: '연인',   color: 'text-pink-400 bg-pink-400/10' },
  { value: 'ally',     label: '동맹',   color: 'text-green-400 bg-green-400/10' },
  { value: 'mentor',    label: '사제',   color: 'text-yellow-400 bg-yellow-400/10' },
  { value: 'colleague', label: '동료',   color: 'text-cyan-400 bg-cyan-400/10' },
  { value: 'neutral',   label: '중립',   color: 'text-zinc-400 bg-zinc-400/10' },
]

function relColor(type: string) {
  return REL_TYPES.find(r => r.value === type)?.color ?? 'text-zinc-400 bg-zinc-400/10'
}
function relLabel(type: string) {
  return REL_TYPES.find(r => r.value === type)?.label ?? type
}

// 캐릭터 검색 드롭다운
function CharSearch({
  characters,
  selected,
  onSelect,
  placeholder,
}: {
  characters: Character[]
  selected: Character | null
  onSelect: (c: Character | null) => void
  placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.trim()
    ? characters.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.streamerName?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : characters

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-zinc-800 px-3 py-1.5 min-w-0">
        <span className="text-xs text-zinc-200 truncate flex-1">{selected.name}</span>
        <button onClick={() => onSelect(null)} className="shrink-0 text-zinc-500 hover:text-zinc-300 cursor-pointer">
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative" onKeyDown={(event) => handleDropdownKeyDown(event, open, setOpen)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
      <input
        data-dropdown-trigger
        role="combobox"
        aria-label={placeholder}
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={(event) => { if (!ref.current?.contains(event.relatedTarget)) setOpen(true) }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-7 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none"
      />
      {open && (
        <div id={listId} role="listbox" aria-label={placeholder} className="absolute left-0 top-full z-50 mt-1 w-56 max-h-52 overflow-y-auto dropdown-scroll rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-600">검색 결과 없음</p>
          ) : filtered.map(c => (
            <button
              key={c.id}
              data-dropdown-option
              role="option"
              aria-selected={false}
              tabIndex={-1}
              type="button"
              onClick={() => { onSelect(c); setOpen(false); setQuery('') }}
              className="w-full px-3 py-2 text-left hover:bg-zinc-800 focus:bg-zinc-700 focus:outline-none transition-colors"
            >
              <span className="text-xs font-medium text-zinc-200">{c.name}</span>
              {c.streamerName && (
                <span className="ml-1.5 text-xs text-zinc-500">{c.streamerName}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 행별 수정/삭제
function RelRow({ r, characters }: { r: Relationship; characters: Character[] }) {
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState(r.type)
  const [desc, setDesc] = useState(r.description ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function save() {
    setSaving(true)
    setSaveError('')
    try {
      const result = await updateRelationship(r.id, { type, description: desc.trim() || null })
      if (result?.error) {
        setSaveError(result.error)
        setSaving(false)
        return
      }
    } catch {
      setSaveError('저장 중 오류가 발생했습니다.')
      setSaving(false)
      return
    }
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      const result = await deleteRelationship(r.id)
      if (result?.error) {
        setDeleteError(result.error)
        setDeleting(false)
      }
    } catch {
      setDeleteError('삭제 중 오류가 발생했습니다.')
      setDeleting(false)
    }
  }

  return (
    <tr className="border-t border-zinc-800 hover:bg-zinc-800/20 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-white">
        {r.character_a?.name ?? '—'}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
          >
            {REL_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        ) : (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${relColor(r.type)}`}>
            {relLabel(r.type)}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-white">
        {r.character_b?.name ?? '—'}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="설명 (선택)"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
        ) : (
          <span className="text-xs text-zinc-500 line-clamp-1">{r.description ?? '—'}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={saving}
                className="cursor-pointer rounded p-1 text-zinc-500 hover:text-green-400 hover:bg-green-400/10 disabled:opacity-50 transition-colors"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => { setEditing(false); setType(r.type); setDesc(r.description ?? ''); setSaveError('') }}
                className="cursor-pointer rounded p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            >
              <Pencil size={12} />
            </button>
          )}

          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="cursor-pointer rounded px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
              >
                {deleting ? '…' : '삭제'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="cursor-pointer rounded p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="cursor-pointer rounded p-1 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
        {(saveError || deleteError) && (
          <p className="mt-1 text-xs text-red-400">{saveError || deleteError}</p>
        )}
      </td>
    </tr>
  )
}

// 새 관계 추가 폼
function AddForm({ characters }: { characters: Character[] }) {
  const [charA, setCharA] = useState<Character | null>(null)
  const [charB, setCharB] = useState<Character | null>(null)
  const [type, setType] = useState('friend')
  const [desc, setDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!charA || !charB) return
    if (charA.id === charB.id) { setError('같은 캐릭터는 선택할 수 없습니다.'); return }
    setError('')
    setAdding(true)
    try {
      const result = await addRelationship({
        character_a_id: charA.id,
        character_b_id: charB.id,
        type,
        description: desc.trim() || null,
      })
      if (result.error) { setError(result.error); setAdding(false); return }
    } catch {
      setError('추가 중 오류가 발생했습니다.')
      setAdding(false)
      return
    }
    setAdding(false)
    setCharA(null)
    setCharB(null)
    setType('friend')
    setDesc('')
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <p className="text-xs font-semibold text-zinc-400">새 관계 추가</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-44">
          <CharSearch characters={characters} selected={charA} onSelect={setCharA} placeholder="캐릭터 A" />
        </div>

        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none cursor-pointer"
        >
          {REL_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <div className="w-44">
          <CharSearch characters={characters} selected={charB} onSelect={setCharB} placeholder="캐릭터 B" />
        </div>

        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="설명 (선택)"
          className="flex-1 min-w-36 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
        />

        <button
          onClick={handleAdd}
          disabled={!charA || !charB || adding}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-40 cursor-pointer transition-colors"
        >
          <Plus size={12} />
          추가
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export default function RelationshipEditor({
  relationships,
  characters,
  total,
  totalPages,
  currentPage,
  pageSize: initialPageSize,
}: {
  relationships: Relationship[]
  characters: Character[]
  total: number
  totalPages: number
  currentPage: number
  pageSize: number
}) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams()
  const [pageSize, setPageSize] = useState(String(initialPageSize))
  function move(changes: Record<string, string>) { const params = new URLSearchParams(searchParams.toString()); for (const [key, value] of Object.entries(changes)) params.set(key, value); if ('pageSize' in changes) params.delete('page'); router.push(`${pathname}?${params.toString()}`, { scroll: false }) }
  return (
    <div className="space-y-4">
      <AddForm characters={characters} />
      <div className="flex items-center justify-end gap-2"><span className="text-xs text-zinc-600">{relationships.length} / {total}건</span><select value={pageSize} onChange={(e) => { setPageSize(e.target.value); move({ pageSize: e.target.value }) }} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300"><option value="10">10개씩</option><option value="20">20개씩</option><option value="30">30개씩</option><option value="40">40개씩</option><option value="50">50개씩</option></select></div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">캐릭터 A</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 w-24">관계</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">캐릭터 B</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">설명</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {relationships.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-600">
                  등록된 관계가 없습니다.
                </td>
              </tr>
            ) : (
              relationships.map(r => (
                <RelRow key={r.id} r={r} characters={characters} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && <nav className="flex items-center justify-center gap-2" aria-label="관계 페이지 이동"><button type="button" onClick={() => move({ page: String(currentPage - 1) })} disabled={currentPage <= 1} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40">이전</button><span className="text-xs text-zinc-500">{currentPage} / {totalPages}</span><button type="button" onClick={() => move({ page: String(currentPage + 1) })} disabled={currentPage >= totalPages} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-40">다음</button></nav>}
    </div>
  )
}
