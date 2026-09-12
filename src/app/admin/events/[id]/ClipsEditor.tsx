'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import { addClip, updateClip, removeClip, reorderClips } from '../actions'
import { Plus, Trash2, ExternalLink, Search, X, Check, Pencil, GripVertical, Save } from 'lucide-react'

type Streamer = { id: string; display_name: string }
type CharacterRef = { name: string; streamer_id: string }
type Clip = { id: string; clip_url: string; label: string | null; sort_order: number; streamers: { display_name: string } | null }
type SearchEntry = { streamerId: string; streamerName: string; characterName?: string }

function ClipRow({ clip, eventId }: { clip: Clip; eventId: string }) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(clip.clip_url)
  const [label, setLabel] = useState(clip.label ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  async function save() {
    setSaving(true)
    setSaveError('')
    try {
      const result = await updateClip(eventId, clip.id, { clip_url: url.trim(), label: label.trim() || null })
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
      const result = await removeClip(eventId, clip.id)
      if (result?.error) {
        setRemoveError(result.error)
        setRemoving(false)
      }
    } catch {
      setRemoveError('삭제 중 오류가 발생했습니다.')
      setRemoving(false)
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-amber-400/30 bg-zinc-800/50 p-3 space-y-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="클립 URL"
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="라벨 (선택)"
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
        />
        <div className="flex gap-1.5">
          <button onClick={save} disabled={saving} className="flex items-center gap-1 rounded bg-amber-400 px-2 py-1 text-xs font-medium text-zinc-900 hover:bg-amber-300 disabled:opacity-50 cursor-pointer">
            <Check size={11} /> 저장
          </button>
          <button onClick={() => { setEditing(false); setUrl(clip.clip_url); setLabel(clip.label ?? ''); setSaveError('') }} className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-600 cursor-pointer">
            취소
          </button>
        </div>
        {saveError && <p className="text-xs text-red-400">{saveError}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2 space-y-1">
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-300 truncate">{clip.label || clip.clip_url}</span>
          <a href={clip.clip_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-zinc-600 hover:text-amber-400 transition-colors">
            <ExternalLink size={11} />
          </a>
        </div>
        {clip.streamers && <span className="text-xs text-zinc-600">{clip.streamers.display_name}</span>}
      </div>
      <button onClick={() => setEditing(true)} className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
        <Pencil size={11} />
      </button>
      <button
        type="button"
        onClick={handleRemove}
        disabled={removing}
        className="cursor-pointer rounded p-1 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
      >
        <Trash2 size={12} />
      </button>
    </div>
    {removeError && <p className="text-xs text-red-400">{removeError}</p>}
    </div>
  )
}

export default function ClipsEditor({
  eventId,
  clips,
  streamers,
  characterRefs = [],
}: {
  eventId: string
  clips: Clip[]
  streamers: Streamer[]
  characterRefs?: CharacterRef[]
}) {
  const [orderedClips, setOrderedClips] = useState<Clip[]>(clips)
  const [orderDirty, setOrderDirty] = useState(false)
  const [orderMsg, setOrderMsg] = useState('')
  const [isPending, startTransition] = useTransition()
  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)

  useEffect(() => { setOrderedClips(clips) }, [clips])

  function handleDragStart(i: number) { dragIndex.current = i }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    dragOverIndex.current = i
  }
  function handleDrop() {
    const from = dragIndex.current
    const to = dragOverIndex.current
    if (from === null || to === null || from === to) return
    const next = [...orderedClips]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOrderedClips(next)
    setOrderDirty(true)
    setOrderMsg('')
    dragIndex.current = null
    dragOverIndex.current = null
  }
  function handleDragEnd() {
    dragIndex.current = null
    dragOverIndex.current = null
  }

  function saveOrder() {
    startTransition(async () => {
      const orders = orderedClips.map((c, i) => ({ id: c.id, sortOrder: i }))
      const result = await reorderClips(eventId, orders)
      if (result?.error) {
        setOrderMsg('저장 실패: ' + result.error)
      } else {
        setOrderDirty(false)
        setOrderMsg('순서 저장 완료')
        setTimeout(() => setOrderMsg(''), 2000)
      }
    })
  }

  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [streamerId, setStreamerId] = useState('')
  const [streamerName, setStreamerName] = useState('')
  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const charByStreamer: Record<string, string[]> = {}
  for (const c of characterRefs) {
    if (!charByStreamer[c.streamer_id]) charByStreamer[c.streamer_id] = []
    charByStreamer[c.streamer_id].push(c.name)
  }

  const entries: SearchEntry[] = streamers.map((s) => ({
    streamerId: s.id,
    streamerName: s.display_name,
    characterName: charByStreamer[s.id]?.[0],
  }))

  const filtered = query.trim()
    ? entries.filter((e) =>
        e.streamerName.toLowerCase().includes(query.toLowerCase()) ||
        (e.characterName?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : entries

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function selectStreamer(entry: SearchEntry) {
    setStreamerId(entry.streamerId)
    setStreamerName(entry.characterName
      ? `${entry.characterName} (${entry.streamerName})`
      : entry.streamerName
    )
    setQuery('')
    setDropdownOpen(false)
  }

  function clearStreamer() {
    setStreamerId('')
    setStreamerName('')
    setQuery('')
  }

  async function handleAdd() {
    if (!url.trim()) return
    setAdding(true)
    setAddError('')
    try {
      const result = await addClip(eventId, {
        clip_url: url.trim(),
        label: label.trim() || null,
        streamer_id: streamerId || null,
        sort_order: clips.length,
      })
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
    setUrl('')
    setLabel('')
    setStreamerId('')
    setStreamerName('')
  }

  return (
    <div className="space-y-3">
      {orderedClips.length > 0 ? (
        <div className="space-y-1.5">
          {orderedClips.map((c, i) => (
            <div
              key={c.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              className="flex items-center gap-1.5"
            >
              <GripVertical size={14} className="shrink-0 cursor-grab text-zinc-600 hover:text-zinc-400" />
              <div className="flex-1 min-w-0">
                <ClipRow clip={c} eventId={eventId} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 py-2">등록된 클립이 없습니다.</p>
      )}

      {orderDirty && (
        <div className="flex items-center gap-2">
          <button
            onClick={saveOrder}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-amber-300 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Save size={12} />
            순서 저장
          </button>
          {orderMsg && <span className="text-xs text-zinc-400">{orderMsg}</span>}
        </div>
      )}
      {!orderDirty && orderMsg && <p className="text-xs text-zinc-400">{orderMsg}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="클립 URL"
          className="flex-1 min-w-48 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="라벨 (선택)"
          className="w-28 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
        />
        <div ref={containerRef} className="relative w-48">
          {streamerId ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-zinc-800 px-3 py-1.5">
              <span className="flex-1 text-xs text-zinc-200 truncate">{streamerName}</span>
              <button onClick={clearStreamer} className="shrink-0 text-zinc-500 hover:text-zinc-300 cursor-pointer">
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
                placeholder="스트리머 / 캐릭터명"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
              />
            </div>
          )}
          {dropdownOpen && !streamerId && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full max-h-52 overflow-y-auto dropdown-scroll rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-600">검색 결과 없음</p>
              ) : (
                filtered.map((e) => (
                  <button
                    key={e.streamerId}
                    type="button"
                    onClick={() => selectStreamer(e)}
                    className="w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors"
                  >
                    {e.characterName && (
                      <span className="text-xs font-medium text-zinc-200">{e.characterName}</span>
                    )}
                    <span className={`text-xs ${e.characterName ? 'text-zinc-500 ml-1.5' : 'text-zinc-200'}`}>
                      {e.streamerName}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={!url.trim() || adding}
          className="flex items-center gap-1 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-40 cursor-pointer transition-colors"
        >
          <Plus size={12} />
          추가
        </button>
      </div>
      {addError && <p className="text-xs text-red-400">{addError}</p>}
    </div>
  )
}
