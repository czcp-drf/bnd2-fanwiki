'use client'

import { useState, useRef, useEffect } from 'react'
import { addParticipant, updateParticipant, removeParticipant } from '../actions'
import { Plus, Trash2, Search, X, Check, Pencil } from 'lucide-react'

type Character = { id: string; name: string; streamer_display_name: string }
type Participant = { id: string; role: string | null; characters: { id: string; name: string } | null }

function ParticipantRow({ p, eventId }: { p: Participant; eventId: string }) {
  const [editing, setEditing] = useState(false)
  const [role, setRole] = useState(p.role ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  async function save() {
    setSaving(true)
    setSaveError('')
    try {
      const result = await updateParticipant(eventId, p.id, role.trim() || null)
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

  async function handleRemove() {
    setRemoving(true)
    setRemoveError('')
    try {
      const result = await removeParticipant(eventId, p.id)
      if (result?.error) {
        setRemoveError(result.error)
        setRemoving(false)
      }
    } catch {
      setRemoveError('삭제 중 오류가 발생했습니다.')
      setRemoving(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2 space-y-1">
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-white">{p.characters?.name ?? '—'}</span>
        {editing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="역할"
              autoFocus
              className="flex-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
            />
            <button onClick={save} disabled={saving} className="cursor-pointer rounded bg-amber-400 p-0.5 text-zinc-900 hover:bg-amber-300 disabled:opacity-50">
              <Check size={11} />
            </button>
            <button onClick={() => { setEditing(false); setRole(p.role ?? ''); setSaveError('') }} className="cursor-pointer rounded bg-zinc-700 p-0.5 text-zinc-300 hover:bg-zinc-600">
              <X size={11} />
            </button>
          </div>
        ) : (
          p.role && <span className="ml-2 text-xs text-zinc-500">{p.role}</span>
        )}
      </div>
      {!editing && (
        <button onClick={() => setEditing(true)} className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
          <Pencil size={11} />
        </button>
      )}
      <button
        type="button"
        onClick={handleRemove}
        disabled={removing}
        className="cursor-pointer rounded p-1 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
      >
        <Trash2 size={12} />
      </button>
    </div>
    {saveError && <p className="text-xs text-red-400">{saveError}</p>}
    {removeError && <p className="text-xs text-red-400">{removeError}</p>}
    </div>
  )
}

export default function ParticipantsEditor({
  eventId,
  participants,
  characters,
}: {
  eventId: string
  participants: Participant[]
  characters: Character[]
}) {
  const [query, setQuery] = useState('')
  const [charId, setCharId] = useState('')
  const [charName, setCharName] = useState('')
  const [role, setRole] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const existingIds = new Set(participants.map((p) => p.characters?.id))
  const available = characters.filter((c) => !existingIds.has(c.id))

  const filtered = query.trim()
    ? available.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.streamer_display_name.toLowerCase().includes(query.toLowerCase())
      )
    : available

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function selectChar(c: Character) {
    setCharId(c.id)
    setCharName(`${c.name} (${c.streamer_display_name})`)
    setQuery('')
    setDropdownOpen(false)
  }

  function clearSelection() {
    setCharId('')
    setCharName('')
    setQuery('')
  }

  async function handleAdd() {
    if (!charId) return
    setAdding(true)
    setAddError('')
    try {
      const result = await addParticipant(eventId, charId, role || null)
      if (result?.error) {
        setAddError(result.error)
        setAdding(false)
        return
      }
    } catch {
      setAddError('추가 중 오류가 발생했습니다.')
      setAdding(false)
      return
    }
    setAdding(false)
    setCharId('')
    setCharName('')
    setRole('')
  }

  return (
    <div className="space-y-3">
      {participants.length > 0 ? (
        <div className="space-y-1.5">
          {participants.map((p) => (
            <ParticipantRow key={p.id} p={p} eventId={eventId} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 py-2">등록된 참여자가 없습니다.</p>
      )}

      {available.length > 0 && (
        <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div ref={containerRef} className="relative flex-1 min-w-52">
            {charId ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-zinc-800 px-3 py-1.5">
                <span className="flex-1 text-xs text-zinc-200 truncate">{charName}</span>
                <button onClick={clearSelection} className="shrink-0 text-zinc-500 hover:text-zinc-300 cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true) }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="캐릭터명 또는 스트리머명 검색"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
            )}
            {dropdownOpen && !charId && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full max-h-52 overflow-y-auto dropdown-scroll rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-zinc-600">검색 결과 없음</p>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectChar(c)}
                      className="w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors"
                    >
                      <span className="text-xs font-medium text-zinc-200">{c.name}</span>
                      <span className="ml-1.5 text-xs text-zinc-500">{c.streamer_display_name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="역할 (선택)"
            className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!charId || adding}
            className="flex items-center gap-1 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Plus size={12} />
            추가
          </button>
        </div>
        {addError && <p className="text-xs text-red-400">{addError}</p>}
        </div>
      )}
    </div>
  )
}
