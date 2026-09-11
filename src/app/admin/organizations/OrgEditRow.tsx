'use client'

import { useState } from 'react'
import { updateOrganization, deleteOrganization } from './actions'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import Select from '@/components/ui/Select'

const categoryLabel: Record<string, string> = {
  city_hall: '시청',
  public_service: '공무직',
  gang: '갱단',
  business: '사업체',
  illegal: '불법 사업체',
}

const categoryColor: Record<string, string> = {
  city_hall: 'text-indigo-400',
  public_service: 'text-blue-400',
  gang: 'text-orange-400',
  business: 'text-emerald-400',
  illegal: 'text-red-400',
}

type GangOption = { id: string; name: string }

type Org = {
  id: string
  name: string
  name_confirmed: boolean
  type: string | null
  category: string | null
  color: string | null
  description: string | null
  is_active: boolean
  is_disbanded: boolean
  gang_id: string | null
}

export default function OrgEditRow({ org, gangs = [] }: { org: Org; gangs?: GangOption[] }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState(org.name)
  const [nameConfirmed, setNameConfirmed] = useState(org.name_confirmed)
  const [description, setDescription] = useState(org.description ?? '')
  const [color, setColor] = useState(org.color ?? '')
  const [isActive, setIsActive] = useState(org.is_active)
  const [isDisbanded, setIsDisbanded] = useState(org.is_disbanded)
  const [gangId, setGangId] = useState(org.gang_id ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isIllegal = org.category === 'illegal'

  const gangOptions = [
    { value: '', label: '미연결' },
    ...gangs.map((g) => ({ value: g.id, label: g.name })),
  ]

  const gangName = gangs.find((g) => g.id === org.gang_id)?.name

  async function save() {
    setSaving(true)
    await updateOrganization(org.id, {
      name: name.trim() || org.name,
      name_confirmed: nameConfirmed,
      description: description.trim() || null,
      color: color.trim() || null,
      is_active: isDisbanded ? false : isActive,
      is_disbanded: isDisbanded,
      gang_id: isIllegal ? (gangId || null) : null,
    })
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteOrganization(org.id)
    setDeleting(false)
  }

  function cancel() {
    setName(org.name)
    setNameConfirmed(org.name_confirmed)
    setDescription(org.description ?? '')
    setColor(org.color ?? '')
    setIsActive(org.is_active)
    setIsDisbanded(org.is_disbanded)
    setGangId(org.gang_id ?? '')
    setConfirmDelete(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="border-t border-zinc-800 bg-zinc-800/30 align-top">
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color || '#52525b'}
              onChange={(e) => setColor(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
            />
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#hex"
              className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
            />
          </div>
        </td>
        <td className="px-4 py-2.5">
          <div className="space-y-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
            />
            <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
              <input
                type="checkbox"
                checked={nameConfirmed}
                onChange={(e) => setNameConfirmed(e.target.checked)}
                className="accent-amber-400"
              />
              명칭 확정
            </label>
          </div>
        </td>
        <td className="px-4 py-2.5 text-xs text-zinc-500">
          {org.category ? categoryLabel[org.category] : '—'}
        </td>
        <td className="px-4 py-2.5">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
          />
        </td>
        {isIllegal && (
          <td className="px-4 py-2.5">
            <Select
              value={gangId}
              onChange={setGangId}
              options={gangOptions}
              fullWidth
            />
          </td>
        )}
        <td className="px-4 py-2.5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
              <input
                type="checkbox"
                checked={isDisbanded}
                onChange={(e) => {
                  setIsDisbanded(e.target.checked)
                  if (e.target.checked) setIsActive(false)
                }}
                className="accent-red-500"
              />
              <span className={isDisbanded ? 'text-red-400' : ''}>해체</span>
            </label>
            {!isDisbanded && (
              <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-amber-400"
                />
                활성
              </label>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <button onClick={save} disabled={saving} className="cursor-pointer rounded bg-amber-400 p-1 text-zinc-900 hover:bg-amber-300 disabled:opacity-50">
              <Check size={12} />
            </button>
            <button onClick={cancel} className="cursor-pointer rounded bg-zinc-700 p-1 text-zinc-300 hover:bg-zinc-600">
              <X size={12} />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? '삭제 중' : '확인'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded bg-zinc-700 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-600 cursor-pointer"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-red-900/40 hover:text-red-400 transition-colors ml-1"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-zinc-800 hover:bg-zinc-800/20 transition-colors">
      <td className="px-4 py-2.5">
        <div
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: org.color ?? '#52525b' }}
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${org.is_disbanded ? 'text-zinc-600 line-through' : 'text-white'}`}>
            {org.name}
          </span>
          {!org.name_confirmed && !org.is_disbanded && (
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">미정</span>
          )}
          {org.is_disbanded && (
            <span className="rounded-full bg-red-950 px-1.5 py-0.5 text-[10px] text-red-500">해체</span>
          )}
          {!org.is_active && !org.is_disbanded && (
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600">비활성</span>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className={`text-xs font-medium ${org.category ? categoryColor[org.category] : 'text-zinc-500'}`}>
          {org.category ? categoryLabel[org.category] : '—'}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-zinc-500 max-w-xs truncate">
        {org.description ?? '—'}
      </td>
      {isIllegal && (
        <td className="px-4 py-2.5 text-xs text-zinc-500">
          {gangName
            ? <span className="text-orange-400/80">{gangName}</span>
            : <span className="text-zinc-700">미연결</span>
          }
        </td>
      )}
      <td className="px-4 py-2.5">
        <span className={`text-xs ${org.is_disbanded ? 'text-red-500' : org.is_active ? 'text-green-400' : 'text-zinc-600'}`}>
          {org.is_disbanded ? '해체' : org.is_active ? '활성' : '비활성'}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <button onClick={() => setEditing(true)} className="cursor-pointer rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
          <Pencil size={12} />
        </button>
      </td>
    </tr>
  )
}
