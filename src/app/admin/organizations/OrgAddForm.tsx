'use client'

import { useState } from 'react'
import { createOrganization } from './actions'
import { Check, Plus, X } from 'lucide-react'
import Select from '@/components/ui/Select'

const categoryOptions = [
  { value: 'city_hall', label: '시청' },
  { value: 'public_service', label: '공무직' },
  { value: 'gang', label: '갱단' },
  { value: 'business', label: '사업체' },
  { value: 'illegal', label: '불법 사업체' },
]

export default function OrgAddForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [category, setCategory] = useState('gang')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    await createOrganization({
      name: name.trim(),
      name_confirmed: nameConfirmed,
      category,
      description: description.trim() || null,
      color: color.trim() || null,
      is_active: true,
    })
    setSaving(false)
    setOpen(false)
    reset()
  }

  function reset() {
    setName('')
    setNameConfirmed(false)
    setCategory('gang')
    setDescription('')
    setColor('')
  }

  function cancel() {
    setOpen(false)
    reset()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors cursor-pointer"
      >
        <Plus size={12} />
        새 조직 추가
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-amber-400/30 bg-zinc-900 p-5 space-y-4">
      <p className="text-sm font-bold text-white">새 조직 추가</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* 명칭 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">명칭</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="조직명 입력"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
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

        {/* 카테고리 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">카테고리</label>
          <Select
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            fullWidth
          />
        </div>

        {/* 색상 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">색상</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color || '#52525b'}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent"
            />
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#hex (선택)"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
            />
          </div>
        </div>

        {/* 설명 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">설명 (선택)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="조직 설명"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={save}
          disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-amber-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          <Check size={12} />
          {saving ? '저장 중...' : '추가'}
        </button>
        <button
          onClick={cancel}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 cursor-pointer transition-colors"
        >
          <X size={12} />
          취소
        </button>
      </div>
    </div>
  )
}
