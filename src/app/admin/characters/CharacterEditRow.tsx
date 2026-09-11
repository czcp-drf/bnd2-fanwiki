'use client'

import { useState, useRef } from 'react'
import { saveCharacter } from './actions'
import { Check, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Select from '@/components/ui/Select'

const statusOptions = [
  { value: 'active', label: '활동' },
  { value: 'dead', label: '사망' },
  { value: 'retired', label: '은퇴' },
  { value: 'hiatus', label: '휴식' },
]

const statusColor: Record<string, string> = {
  active: 'text-green-400',
  dead: 'text-red-400',
  retired: 'text-zinc-400',
  hiatus: 'text-yellow-400',
}

type OrgOption = { id: string; name: string }

type CharacterData = {
  id: string
  name: string
  job: string | null
  status: string
  streamer_display_name: string
  org_id: string | null
  org_role: string | null
  org_name: string | null
}

type Props = {
  character: CharacterData
  organizations: OrgOption[]
}

export default function CharacterEditRow({ character: c, organizations }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(c.name)
  const [job, setJob] = useState(c.job ?? '')
  const [status, setStatus] = useState(c.status)
  const [orgId, setOrgId] = useState(c.org_id ?? '')
  const [orgRole, setOrgRole] = useState(c.org_role ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const inFlight = useRef(false)

  const orgOptions = [
    { value: '', label: '무소속' },
    ...organizations.map((o) => ({ value: o.id, label: o.name })),
  ]

  async function save() {
    if (inFlight.current) return
    inFlight.current = true
    setSaved(false)
    setSaving(true)
    setError(null)
    try {
    const result = await saveCharacter(c.id, {
        name: name.trim() || '미정',
        job: job.trim() || null,
        status,
        orgId: orgId || null,
        orgRole: orgRole.trim() || null,
      })
    if (result.error) { setError(result.error); return }
    setSaved(true)
    setEditing(false)
    } catch {
      setError('저장 결과를 확인하지 못했습니다. 새로고침하여 반영 여부를 확인해 주세요.')
    } finally { setSaving(false); inFlight.current = false }
  }

  function cancel() {
    if (inFlight.current) return
    setError(null)
    setName(c.name)
    setJob(c.job ?? '')
    setStatus(c.status)
    setOrgId(c.org_id ?? '')
    setOrgRole(c.org_role ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="border-t border-zinc-800 bg-zinc-800/30">
        <td className="px-4 py-2 text-xs text-zinc-400">{c.streamer_display_name}</td>
        <td className="px-4 py-2">
          <input
            value={name}
            disabled={saving}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
          />
        </td>
        <td className="px-4 py-2">
          <input
            value={job}
            disabled={saving}
            onChange={(e) => setJob(e.target.value)}
            placeholder="직업"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
          />
        </td>
        <td className="px-4 py-2">
          <Select
            value={status}
            disabled={saving}
            onChange={setStatus}
            options={statusOptions}
            fullWidth
          />
        </td>
        <td className="px-4 py-2 space-y-1">
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          <Select
            value={orgId}
            disabled={saving}
            onChange={setOrgId}
            options={orgOptions}
            fullWidth
          />
          {orgId && (
            <input
              value={orgRole}
              disabled={saving}
              onChange={(e) => setOrgRole(e.target.value)}
              placeholder="직급 (예: 병원장)"
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
            />
          )}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <button onClick={save} disabled={saving} className="cursor-pointer rounded bg-amber-400 p-1 text-zinc-900 hover:bg-amber-300 disabled:opacity-50">
              <Check size={12} />
            </button>
            <button onClick={cancel} disabled={saving} className="cursor-pointer rounded bg-zinc-700 p-1 text-zinc-300 hover:bg-zinc-600 disabled:opacity-50">
              <X size={12} />
            </button>
          </div>
          {saving && <span role="status" className="text-xs text-amber-400">저장 중…</span>}
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-zinc-800 hover:bg-zinc-800/20 transition-colors">
      <td className="px-4 py-2.5 text-xs text-zinc-400">{c.streamer_display_name}</td>
      <td className="px-4 py-2.5 text-xs font-medium text-white">
        {c.name === '미정' ? <span className="text-zinc-600">미정</span> : c.name}
      </td>
      <td className="px-4 py-2.5 text-xs text-zinc-500">{c.job ?? '—'}</td>
      <td className="px-4 py-2.5">
        <span className={cn('text-xs font-medium', statusColor[c.status])}>
          {statusOptions.find((o) => o.value === c.status)?.label}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-zinc-500">
        {c.org_name
          ? <span>{c.org_name}{c.org_role ? <span className="text-zinc-600 ml-1">· {c.org_role}</span> : null}</span>
          : <span className="text-zinc-700">무소속</span>
        }
      </td>
      <td className="px-4 py-2.5">
        {saved && <span role="status" className="block whitespace-nowrap text-xs text-green-400">저장 완료</span>}
        <button onClick={() => { cancel(); setSaved(false); setEditing(true) }} className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
          <Pencil size={12} />
        </button>
      </td>
    </tr>
  )
}
