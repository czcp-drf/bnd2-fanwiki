'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { MapPin, X } from 'lucide-react'
import { createEvent, updateEvent, deleteEvent } from './actions'

const MapPinPicker = dynamic(() => import('@/components/report/MapPinPicker'), { ssr: false })

const typeOptions = [
  { value: 'war', label: '전쟁/항쟁' },
  { value: 'crime', label: '범죄' },
  { value: 'political', label: '정치' },
  { value: 'social', label: '사회' },
  { value: 'other', label: '기타' },
]

type EventData = {
  id?: string
  title: string
  summary: string
  content: string
  type: string
  occurred_at: string
  thumbnail_url: string
  is_published: boolean
  location_x?: number | null
  location_y?: number | null
}

export default function EventForm({ initial }: { initial?: EventData }) {
  const isEdit = !!initial?.id
  const [title, setTitle] = useState(initial?.title ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [type, setType] = useState(initial?.type ?? 'other')
  const [occurredAt, setOccurredAt] = useState(initial?.occurred_at ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? '')
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false)
  const [locationX, setLocationX] = useState<number | null>(initial?.location_x ?? null)
  const [locationY, setLocationY] = useState<number | null>(initial?.location_y ?? null)
  const [showMap, setShowMap] = useState(!!(initial?.location_x || initial?.location_y))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const router = useRouter()

  function handleMapPick(lat: number, lng: number) {
    setLocationX(lng)
    setLocationY(lat)
  }

  function clearLocation() {
    setLocationX(null)
    setLocationY(null)
  }

  async function save() {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    setSaving(true)
    setError('')
    const data = {
      title: title.trim(),
      summary: summary.trim() || null,
      content: content.trim() || null,
      type,
      occurred_at: occurredAt || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      is_published: isPublished,
      location_x: locationX,
      location_y: locationY,
    }
    try {
      if (isEdit) {
        const res = await updateEvent(initial!.id!, data)
        if (res?.error) setError(res.error)
      } else {
        const res = await createEvent(data)
        if (res?.error) {
          setError(res.error)
        } else if (res?.id) {
          router.push(`/admin/events/${res.id}/edit`)
          return
        }
      }
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      {/* 기본 정보 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">제목 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="사건 제목"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">유형</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-amber-400/50 focus:outline-none"
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">발생 일시</label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-amber-400/50 focus:outline-none [color-scheme:dark]"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">썸네일 URL</label>
          <input
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="이미지 URL (선택)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">요약</label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="목록에서 표시되는 짧은 설명"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">본문</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="사건 내용을 자세히 작성해주세요."
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
        </div>
      </div>

      {/* 위치 정보 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-500">발생 위치 (선택)</label>
          <div className="flex items-center gap-2">
            {(locationX !== null || locationY !== null) && (
              <button
                type="button"
                onClick={clearLocation}
                className="flex items-center gap-1 text-xs text-zinc-600 hover:text-red-400 transition-colors"
              >
                <X size={11} /> 위치 제거
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="flex items-center gap-1.5 rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-amber-400/50 hover:text-amber-400 transition-colors"
            >
              <MapPin size={11} />
              {showMap ? '지도 닫기' : '지도에서 선택'}
            </button>
          </div>
        </div>

        {/* 좌표 직접 입력 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-xs text-zinc-600 w-4">X</span>
            <input
              type="number"
              step="0.1"
              value={locationX ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                setLocationX(isNaN(v) ? null : v)
              }}
              placeholder="경도 (선택)"
              className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-xs text-zinc-600 w-4">Y</span>
            <input
              type="number"
              step="0.1"
              value={locationY ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                setLocationY(isNaN(v) ? null : v)
              }}
              placeholder="위도 (선택)"
              className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
            />
          </div>
        </div>

        {/* 지도 */}
        {showMap && (
          <div className="rounded-lg overflow-hidden border border-zinc-700" style={{ height: 280 }}>
            <MapPinPicker
              coords={locationX !== null && locationY !== null ? { lat: locationY, lng: locationX } : null}
              onPick={handleMapPick}
            />
          </div>
        )}

        {locationX !== null && locationY !== null && (
          <p className="text-xs text-amber-400/70">
            X: {locationX.toFixed(1)}, Y: {locationY.toFixed(1)}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="accent-amber-400"
        />
        공개 (체크 시 사건 페이지에 노출)
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-bold text-zinc-900 hover:bg-amber-300 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {saving ? '저장 중...' : isEdit ? '수정 저장' : '작성 완료'}
        </button>
        <button
          onClick={() => router.push('/admin/events')}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 cursor-pointer transition-colors"
        >
          취소
        </button>
        {isEdit && (
          <div className="ml-auto flex items-center gap-2">
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    setSaving(true)
                    setError('')
                    try {
                      const res = await deleteEvent(initial!.id!)
                      if (res?.error) {
                        setError(res.error)
                        setSaving(false)
                        setConfirmDelete(false)
                      } else {
                        router.push('/admin/events')
                      }
                    } catch {
                      setError('삭제 중 오류가 발생했습니다. 다시 시도해주세요.')
                      setSaving(false)
                      setConfirmDelete(false)
                    }
                  }}
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {saving ? '…' : '삭제 확인'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-700 cursor-pointer transition-colors"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-600 hover:border-red-900 hover:text-red-400 cursor-pointer transition-colors"
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
