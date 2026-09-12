'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, UserMinus, UserPlus, ChevronDown, ChevronUp, Pencil, RotateCcw, Save, GripVertical, ChevronsUpDown } from 'lucide-react'
import { addOrgMembers, updateOrgMember, setMembersLeft, restoreMember, reorderMembers } from './actions'

export type MemberRow = {
  character_id: string
  character_name: string
  character_status: string
  streamer_name: string | null
  role: string | null
  is_primary: boolean
  joined_at: string | null
  left_at: string | null
  sort_order: number
}

export type CharOption = {
  id: string
  name: string
  job: string | null
  streamer_name: string | null
}

const statusLabel: Record<string, string> = {
  active: '활동', dead: '사망', retired: '은퇴', hiatus: '휴식',
}
const statusColor: Record<string, string> = {
  active: 'text-green-400', dead: 'text-red-400', retired: 'text-zinc-500', hiatus: 'text-yellow-400',
}

export default function MemberManageClient({
  orgId,
  members,
  characters,
}: {
  orgId: string
  members: MemberRow[]
  characters: CharOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const initialActive = members.filter((m) => !m.left_at)
  const pastMembers = members.filter((m) => m.left_at)

  // Reorder state
  const [orderedMembers, setOrderedMembers] = useState<MemberRow[]>(initialActive)
  const [orderDirty, setOrderDirty] = useState(false)
  const [orderMsg, setOrderMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const activeMembers = orderedMembers

  // Bulk selection for departure
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [leaveMsg, setLeaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Inline role editing
  const [editing, setEditing] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editIsPrimary, setEditIsPrimary] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Pending additions
  const [pendingAdds, setPendingAdds] = useState<
    { id: string; name: string; role: string; isPrimary: boolean }[]
  >([])
  const [search, setSearch] = useState('')
  const [addMsg, setAddMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Past members toggle
  const [showPast, setShowPast] = useState(false)

  // Column sort
  type SortState = { key: string; dir: 'asc' | 'desc' } | null
  const [activeSort, setActiveSort] = useState<SortState>(null)
  const [pastSort, setPastSort] = useState<SortState>(null)

  function toggleSort(sort: SortState, setSort: (s: SortState) => void, key: string) {
    if (sort?.key === key) {
      setSort(sort.dir === 'asc' ? { key, dir: 'desc' } : null)
    } else {
      setSort({ key, dir: 'asc' })
    }
  }

  function sortMembers<T extends MemberRow>(list: T[], sort: SortState): T[] {
    if (!sort) return list
    return [...list].sort((a, b) => {
      let va: string | boolean | null | undefined
      let vb: string | boolean | null | undefined
      if (sort.key === 'name')     { va = a.character_name; vb = b.character_name }
      else if (sort.key === 'streamer') { va = a.streamer_name; vb = b.streamer_name }
      else if (sort.key === 'role')    { va = a.role; vb = b.role }
      else if (sort.key === 'primary') { va = a.is_primary; vb = b.is_primary }
      else if (sort.key === 'left_at') { va = a.left_at; vb = b.left_at }
      if (va == null && vb == null) return 0
      if (va == null) return sort.dir === 'asc' ? 1 : -1
      if (vb == null) return sort.dir === 'asc' ? -1 : 1
      if (typeof va === 'boolean') {
        const cmp = va === vb ? 0 : va ? -1 : 1
        return sort.dir === 'asc' ? cmp : -cmp
      }
      const cmp = String(va).localeCompare(String(vb), 'ko')
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }

  function SortIcon({ col, sort }: { col: string; sort: SortState }) {
    if (!sort || sort.key !== col) return <ChevronsUpDown size={10} className="text-zinc-700 ml-1 inline-block" />
    return sort.dir === 'asc'
      ? <ChevronUp size={10} className="text-amber-400 ml-1 inline-block" />
      : <ChevronDown size={10} className="text-amber-400 ml-1 inline-block" />
  }

  const displayedMembers = sortMembers(activeMembers, activeSort)
  const displayedPastMembers = sortMembers(pastMembers, pastSort)

  // --- Drag & Drop reorder ---
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex !== null && dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    // 정렬 상태라면 정렬된 순서 기준으로 재배치 후 정렬 해제
    const base = sortMembers(orderedMembers, activeSort)
    const next = [...base]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setOrderedMembers(next)
    if (activeSort) setActiveSort(null)
    setOrderDirty(true)
    setOrderMsg(null)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  function saveOrder() {
    setOrderMsg(null)
    startTransition(async () => {
      const orders = orderedMembers.map((m, i) => ({
        characterId: m.character_id,
        sortOrder: i,
      }))
      const res = await reorderMembers(orgId, orders)
      if (res.error) { setOrderMsg({ type: 'err', text: res.error }); return }
      setOrderDirty(false)
      setOrderMsg({ type: 'ok', text: '순서 저장 완료' })
      router.refresh()
    })
  }

  // --- Inline edit ---
  function startEdit(m: MemberRow) {
    setEditing(m.character_id)
    setEditRole(m.role ?? '')
    setEditIsPrimary(m.is_primary)
    setEditError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setEditError(null)
  }

  function saveEdit(characterId: string) {
    startTransition(async () => {
      const res = await updateOrgMember(orgId, characterId, {
        role: editRole.trim() || null,
        isPrimary: editIsPrimary,
      })
      if (res.error) { setEditError(res.error); return }
      setEditing(null)
      router.refresh()
    })
  }

  // --- Bulk departure ---
  const allSelected =
    activeMembers.length > 0 && selected.size === activeMembers.length

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(activeMembers.map((m) => m.character_id)) : new Set())
  }

  function toggleOne(id: string, checked: boolean) {
    const next = new Set(selected)
    checked ? next.add(id) : next.delete(id)
    setSelected(next)
  }

  function handleBulkLeave() {
    const ids = Array.from(selected)
    if (!ids.length) return
    setLeaveMsg(null)
    startTransition(async () => {
      const res = await setMembersLeft(orgId, ids)
      if (res.error) { setLeaveMsg({ type: 'err', text: res.error }); return }
      setSelected(new Set())
      setLeaveMsg({ type: 'ok', text: `${ids.length}명 탈퇴 처리 완료` })
      router.refresh()
    })
  }

  // --- Pending adds ---
  function addToPending(c: CharOption) {
    if (pendingAdds.some((p) => p.id === c.id)) return
    setPendingAdds((prev) => [...prev, { id: c.id, name: c.name, role: '', isPrimary: false }])
    setSearch('')
    setAddMsg(null)
  }

  function removePending(id: string) {
    setPendingAdds((prev) => prev.filter((p) => p.id !== id))
  }

  function updatePendingField(
    id: string,
    field: 'role' | 'isPrimary',
    value: string | boolean
  ) {
    setPendingAdds((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  function submitAdds() {
    if (!pendingAdds.length) return
    const count = pendingAdds.length
    setAddMsg(null)
    startTransition(async () => {
      const res = await addOrgMembers(
        orgId,
        pendingAdds.map((p) => ({
          characterId: p.id,
          role: p.role.trim() || null,
          isPrimary: p.isPrimary,
        }))
      )
      if (res.error) { setAddMsg({ type: 'err', text: res.error }); return }
      setPendingAdds([])
      setAddMsg({ type: 'ok', text: `${count}명 추가 완료` })
      router.refresh()
    })
  }

  // --- Restore ---
  function handleRestore(characterId: string) {
    startTransition(async () => {
      await restoreMember(orgId, characterId)
      router.refresh()
    })
  }

  // Available characters for search
  const activeMemberIds = new Set(activeMembers.map((m) => m.character_id))
  const pastMemberIds = new Set(pastMembers.map((m) => m.character_id))
  const pendingIds = new Set(pendingAdds.map((p) => p.id))
  const q = search.trim().toLowerCase()
  const searchResults = q
    ? characters
        .filter(
          (c) =>
            !activeMemberIds.has(c.id) &&
            !pastMemberIds.has(c.id) &&
            !pendingIds.has(c.id) &&
            (c.name.toLowerCase().includes(q) || (c.streamer_name?.toLowerCase().includes(q) ?? false))
        )
        .slice(0, 20)
    : []

  return (
    <div className="space-y-10">
      {/* ── 현재 멤버 ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            현재 멤버{' '}
            <span className="font-normal text-zinc-500">({activeMembers.length}명)</span>
          </h2>
          <div className="flex items-center gap-2">
            {orderDirty && (
              <button
                onClick={saveOrder}
                disabled={isPending}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-400/20 disabled:opacity-50"
              >
                <Save size={12} />
                순서 저장
              </button>
            )}
            {selected.size > 0 && (
              <button
                onClick={handleBulkLeave}
                disabled={isPending}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
              >
                <UserMinus size={12} />
                선택 {selected.size}명 탈퇴 처리
              </button>
            )}
          </div>
        </div>

        {orderMsg && (
          <p className={`text-xs ${orderMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {orderMsg.text}
          </p>
        )}
        {leaveMsg && (
          <p className={`text-xs ${leaveMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {leaveMsg.text}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-900">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="cursor-pointer accent-amber-400"
                  />
                </th>
                {(['name', 'streamer', 'role', 'primary'] as const).map((col) => (
                  <th
                    key={col}
                    onClick={() => toggleSort(activeSort, setActiveSort, col)}
                    className={`px-4 py-3 text-left text-xs font-medium cursor-pointer select-none transition-colors hover:text-zinc-300 ${activeSort?.key === col ? 'text-amber-400' : 'text-zinc-500'} ${col === 'primary' ? 'w-16' : ''}`}
                  >
                    {{ name: '캐릭터', streamer: '스트리머', role: '역할', primary: '주소속' }[col]}
                    <SortIcon col={col} sort={activeSort} />
                  </th>
                ))}
                <th className="w-8 px-2 py-3" />
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {activeMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-xs text-zinc-600">
                    등록된 멤버가 없습니다.
                  </td>
                </tr>
              ) : (
                displayedMembers.map((m, index) => {
                  const isEditing = editing === m.character_id
                  const isDragging = dragIndex === index
                  const isDragOver = dragOverIndex === index && dragIndex !== index
                  return (
                    <tr
                      key={m.character_id}
                      draggable={!isEditing}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      className={`border-t border-zinc-800 transition-colors ${
                        isDragging ? 'opacity-40' : 'hover:bg-zinc-800/20'
                      } ${isDragOver ? 'bg-amber-400/5 border-t-amber-400/40' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(m.character_id)}
                          onChange={(e) => toggleOne(m.character_id, e.target.checked)}
                          className="cursor-pointer accent-amber-400"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-xs font-medium text-white">{m.character_name}</div>
                        <div className={`text-[10px] ${statusColor[m.character_status] ?? 'text-zinc-500'}`}>
                          {statusLabel[m.character_status] ?? m.character_status}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500">
                        {m.streamer_name ?? '—'}
                      </td>

                      {isEditing ? (
                        <>
                          <td className="px-4 py-2" colSpan={2}>
                            <div className="flex items-center gap-2">
                              <input
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                placeholder="역할 (예: 부두목)"
                                autoFocus
                                className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
                              />
                              <label className="flex cursor-pointer items-center gap-1 whitespace-nowrap text-xs text-zinc-400">
                                <input
                                  type="checkbox"
                                  checked={editIsPrimary}
                                  onChange={(e) => setEditIsPrimary(e.target.checked)}
                                  className="accent-amber-400"
                                />
                                주소속
                              </label>
                            </div>
                            {editError && (
                              <p className="mt-1 text-xs text-red-400">{editError}</p>
                            )}
                          </td>
                          <td className="px-4 py-2" colSpan={2}>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => saveEdit(m.character_id)}
                                disabled={isPending}
                                className="cursor-pointer rounded bg-amber-400 p-1 text-zinc-900 hover:bg-amber-300 disabled:opacity-50"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={isPending}
                                className="cursor-pointer rounded bg-zinc-700 p-1 text-zinc-300 hover:bg-zinc-600 disabled:opacity-50"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2.5 text-xs text-zinc-400">
                            {m.role ?? <span className="text-zinc-700">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-xs">
                            {m.is_primary ? (
                              <span className="text-amber-400">✓</span>
                            ) : (
                              <span className="text-zinc-700">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            <span className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 flex items-center">
                              <GripVertical size={14} />
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => startEdit(m)}
                              className="cursor-pointer rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                            >
                              <Pencil size={12} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 멤버 추가 ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">멤버 추가</h2>

        {/* 대기열 */}
        {pendingAdds.length > 0 && (
          <div className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50">
            {pendingAdds.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-xs font-medium text-white">{p.name}</span>
                <input
                  value={p.role}
                  onChange={(e) => updatePendingField(p.id, 'role', e.target.value)}
                  placeholder="역할"
                  className="w-28 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
                />
                <label className="flex cursor-pointer items-center gap-1 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={p.isPrimary}
                    onChange={(e) => updatePendingField(p.id, 'isPrimary', e.target.checked)}
                    className="accent-amber-400"
                  />
                  주소속
                </label>
                <button
                  onClick={() => removePending(p.id)}
                  className="cursor-pointer text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {addMsg && (
          <p className={`text-xs ${addMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {addMsg.text}
          </p>
        )}

        {pendingAdds.length > 0 && (
          <button
            onClick={submitAdds}
            disabled={isPending}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-amber-300 disabled:opacity-50"
          >
            <UserPlus size={13} />
            {pendingAdds.length}명 일괄 추가
          </button>
        )}

        {/* 검색 */}
        <div className="relative space-y-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="캐릭터명 또는 스트리머명으로 검색 후 클릭해 대기열에 추가…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          {searchResults.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addToPending(c)}
                  className="flex w-full cursor-pointer items-center gap-3 border-t border-zinc-800 px-4 py-2.5 text-left transition-colors hover:bg-zinc-800 first:border-0"
                >
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white">{c.name}</div>
                    {c.job && <div className="text-[10px] text-zinc-500">{c.job}</div>}
                  </div>
                  {c.streamer_name && (
                    <span className="shrink-0 text-[10px] text-zinc-600">{c.streamer_name}</span>
                  )}
                  <UserPlus size={12} className="shrink-0 text-zinc-500" />
                </button>
              ))}
            </div>
          )}
          {q && searchResults.length === 0 && (
            <p className="px-1 text-xs text-zinc-600">검색 결과 없음</p>
          )}
        </div>
      </section>

      {/* ── 이전 멤버 ── */}
      {pastMembers.length > 0 && (
        <section className="space-y-3">
          <button
            onClick={() => setShowPast((v) => !v)}
            className="flex cursor-pointer items-center gap-2 text-sm font-bold text-zinc-500 transition-colors hover:text-zinc-300"
          >
            이전 멤버{' '}
            <span className="font-normal">({pastMembers.length}명)</span>
            {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showPast && (
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-900">
                    {(['name', 'role', 'left_at'] as const).map((col) => (
                      <th
                        key={col}
                        onClick={() => toggleSort(pastSort, setPastSort, col)}
                        className={`px-4 py-3 text-left text-xs font-medium cursor-pointer select-none transition-colors hover:text-zinc-300 ${pastSort?.key === col ? 'text-amber-400' : 'text-zinc-500'}`}
                      >
                        {{ name: '캐릭터', role: '역할', left_at: '탈퇴일' }[col]}
                        <SortIcon col={col} sort={pastSort} />
                      </th>
                    ))}
                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {displayedPastMembers.map((m) => (
                    <tr
                      key={m.character_id}
                      className="border-t border-zinc-800 opacity-50 transition-opacity hover:opacity-100"
                    >
                      <td className="px-4 py-2.5">
                        <div className="text-xs font-medium text-zinc-300">{m.character_name}</div>
                        {m.streamer_name && (
                          <div className="text-[10px] text-zinc-600">{m.streamer_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-600">{m.role ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-600">
                        {m.left_at
                          ? new Date(m.left_at).toLocaleDateString('ko-KR')
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleRestore(m.character_id)}
                          disabled={isPending}
                          className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[10px] text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
                        >
                          <RotateCcw size={10} />
                          복귀
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
