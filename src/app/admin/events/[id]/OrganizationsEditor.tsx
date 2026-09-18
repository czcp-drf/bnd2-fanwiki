'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Check, GripVertical, Pencil, Plus, Search, Save, Trash2, X } from 'lucide-react'
import { addEventOrganization, removeEventOrganization, reorderEventOrganizations, updateEventOrganization } from '../actions'

type Organization = { id: string; name: string; type: string | null; category: string | null }
type Participant = { id: string; sort_order: number; role: string | null; organizations: { id: string; name: string; type: string | null; category: string | null } | null }

function OrganizationRow({ participant, eventId }: { participant: Participant; eventId: string }) {
  const [editing, setEditing] = useState(false)
  const [role, setRole] = useState(participant.role ?? '')
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const result = await updateEventOrganization(eventId, participant.id, role.trim() || null)
      if (result?.error) setMessage(result.error)
      else { setEditing(false); setMessage('') }
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await removeEventOrganization(eventId, participant.id)
      if (result?.error) setMessage(result.error)
    })
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-white">{participant.organizations?.name ?? '—'}</span>
          {participant.organizations?.category && <span className="ml-2 text-xs text-zinc-500">{participant.organizations.category}</span>}
          {editing ? (
            <div className="mt-1 flex items-center gap-1.5">
              <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="역할" className="flex-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none" />
              <button type="button" onClick={save} disabled={pending} className="cursor-pointer rounded bg-amber-400 p-0.5 text-zinc-900 disabled:opacity-50"><Check size={11} /></button>
              <button type="button" onClick={() => { setEditing(false); setRole(participant.role ?? '') }} className="cursor-pointer rounded bg-zinc-700 p-0.5 text-zinc-300"><X size={11} /></button>
            </div>
          ) : participant.role ? <span className="ml-2 text-xs text-zinc-500">{participant.role}</span> : null}
        </div>
        {!editing && <button type="button" onClick={() => setEditing(true)} className="cursor-pointer rounded p-1 text-zinc-600 hover:text-zinc-300"><Pencil size={11} /></button>}
        <button type="button" onClick={remove} disabled={pending} className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-red-900/20 hover:text-red-400 disabled:opacity-50"><Trash2 size={12} /></button>
      </div>
      {message && <p className="mt-1 text-xs text-red-400">{message}</p>}
    </div>
  )
}

export default function OrganizationsEditor({ eventId, participants, organizations }: { eventId: string; participants: Participant[]; organizations: Organization[] }) {
  const [ordered, setOrdered] = useState(participants)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')
  const [orderDirty, setOrderDirty] = useState(false)
  const [pending, startTransition] = useTransition()
  const dragIndex = useRef<number | null>(null)

  useEffect(() => setOrdered(participants), [participants])

  const existingIds = new Set(participants.map((participant) => participant.organizations?.id))
  const available = organizations.filter((organization) => !existingIds.has(organization.id))
  const filtered = available.filter((organization) => `${organization.name} ${organization.category ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  const selected = available.find((organization) => organization.id === selectedId)

  function add() {
    if (!selectedId) return
    startTransition(async () => {
      const result = await addEventOrganization(eventId, selectedId, role.trim() || null)
      if (result?.error) setMessage(result.error)
      else { setSelectedId(''); setQuery(''); setRole(''); setMessage('') }
    })
  }

  function saveOrder() {
    startTransition(async () => {
      const result = await reorderEventOrganizations(eventId, ordered.map((participant, index) => ({ id: participant.id, sortOrder: index })))
      if (result?.error) setMessage(result.error)
      else { setOrderDirty(false); setMessage('순서 저장 완료') }
    })
  }

  return (
    <div className="space-y-3">
      {ordered.length ? <div className="space-y-1.5">{ordered.map((participant, index) => (
        <div key={participant.id} draggable onDragStart={() => { dragIndex.current = index }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
          event.preventDefault()
          const from = dragIndex.current
          if (from === null || from === index) return
          const next = [...ordered]
          const [item] = next.splice(from, 1)
          next.splice(index, 0, item)
          setOrdered(next); setOrderDirty(true); dragIndex.current = null
        }} className="flex items-center gap-1.5">
          <GripVertical size={14} className="shrink-0 cursor-grab text-zinc-600" />
          <div className="min-w-0 flex-1"><OrganizationRow participant={participant} eventId={eventId} /></div>
        </div>
      ))}</div> : <p className="py-2 text-xs text-zinc-600">등록된 참여 조직이 없습니다.</p>}
      {orderDirty && <button type="button" onClick={saveOrder} disabled={pending} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-medium text-zinc-900 disabled:opacity-50"><Save size={12} />순서 저장</button>}
      {available.length > 0 && <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1">
            <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input value={selected ? `${selected.name}${selected.category ? ` (${selected.category})` : ''}` : query} onChange={(event) => { setSelectedId(''); setQuery(event.target.value) }} placeholder="조직명 검색" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none" />
            {!selectedId && query && <div className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">{filtered.length ? filtered.map((organization) => <button key={organization.id} type="button" onClick={() => { setSelectedId(organization.id); setQuery('') }} className="w-full cursor-pointer px-3 py-2 text-left hover:bg-zinc-800"><span className="text-xs font-medium text-zinc-200">{organization.name}</span>{organization.category && <span className="ml-1.5 text-xs text-zinc-500">{organization.category}</span>}</button>) : <p className="px-3 py-2 text-xs text-zinc-600">검색 결과 없음</p>}</div>}
          </div>
          <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="역할 (선택)" className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none" />
          <button type="button" onClick={add} disabled={!selectedId || pending} className="flex cursor-pointer items-center gap-1 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"><Plus size={12} />추가</button>
        </div>
        {message && <p className="text-xs text-red-400">{message}</p>}
      </div>}
    </div>
  )
}
