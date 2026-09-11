'use client'

import dynamic from 'next/dynamic'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrgHq, addMapLocation, updateMapLocation, deleteMapLocation } from './actions'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/map/constants'
import type { AdminOrg, AdminLocation } from './AdminLeafletMap'

const AdminLeafletMap = dynamic(() => import('./AdminLeafletMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-900" />,
})

const CATEGORY_ORDER = ['city_hall', 'public_service', 'gang', 'business', 'illegal'] as const

// ── 조직 거점 탭 ────────────────────────────────────────

function OrgTab({ orgs, locations }: { orgs: AdminOrg[]; locations: AdminLocation[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [hqLabel, setHqLabel] = useState('')

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId)

  function handleSelectOrg(org: AdminOrg) {
    if (selectedOrgId === org.id) {
      setSelectedOrgId(null); setPendingCoords(null); setHqLabel('')
    } else {
      setSelectedOrgId(org.id); setPendingCoords(null); setHqLabel(org.hq_label ?? '')
    }
  }

  function handleSave() {
    if (!selectedOrgId || !pendingCoords) return
    startTransition(async () => {
      await updateOrgHq(selectedOrgId, { hq_x: pendingCoords.lng, hq_y: pendingCoords.lat, hq_label: hqLabel.trim() || null })
      router.refresh(); setSelectedOrgId(null); setPendingCoords(null); setHqLabel('')
    })
  }

  function handleClear() {
    if (!selectedOrgId) return
    startTransition(async () => {
      await updateOrgHq(selectedOrgId, { hq_x: null, hq_y: null, hq_label: null })
      router.refresh(); setSelectedOrgId(null); setPendingCoords(null); setHqLabel('')
    })
  }

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = orgs.filter((o) => o.category === cat)
    return acc
  }, {} as Record<string, AdminOrg[]>)

  return (
    <div className="flex h-full overflow-hidden">
      {/* 좌측: 조직 목록 */}
      <aside className="w-60 shrink-0 overflow-y-auto border-r border-zinc-800 p-3 space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const list = grouped[cat]
          if (!list?.length) return null
          return (
            <div key={cat}>
              <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                {CATEGORY_LABEL[cat]}
              </p>
              <div className="space-y-0.5">
                {list.map((org) => {
                  const hasHq = org.hq_x !== null
                  const isSelected = selectedOrgId === org.id
                  return (
                    <button key={org.id} onClick={() => handleSelectOrg(org)}
                      className={`w-full cursor-pointer rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${isSelected ? 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: org.color ?? CATEGORY_COLOR[cat] ?? '#71717a', opacity: hasHq ? 1 : 0.3 }} />
                        <span className="truncate flex-1">{org.name}</span>
                        {hasHq && <span className="text-[9px] text-green-500 font-medium">HQ</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </aside>

      {/* 우측: 지도 */}
      <div className="relative flex-1 overflow-hidden">
        <AdminLeafletMap orgs={orgs} locations={locations} mode="org"
          selectedOrgId={selectedOrgId} selectedLocationId={null}
          pendingCoords={pendingCoords} onMapClick={(lat, lng) => setPendingCoords({ lat, lng })} />

        {selectedOrgId && !pendingCoords && (
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full border border-amber-400/40 bg-zinc-900/90 px-4 py-2 text-xs text-amber-400 backdrop-blur-sm">
            지도를 클릭해 <strong>{selectedOrg?.name}</strong>의 거점을 찍어주세요
          </div>
        )}

        {selectedOrgId && pendingCoords && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-80 rounded-xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-xl space-y-3">
            <p className="text-sm font-bold text-white">{selectedOrg?.name} <span className="ml-1 text-xs font-normal text-zinc-500">거점 저장</span></p>
            <input value={hqLabel} onChange={(e) => setHqLabel(e.target.value)}
              placeholder="거점 이름 (예: Grove Street 본부)"
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600" />
            <p className="text-[10px] text-zinc-600">다시 클릭하면 위치를 변경할 수 있습니다</p>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={isPending}
                className="flex-1 rounded bg-amber-400 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-300 disabled:opacity-50 cursor-pointer transition-colors">
                {isPending ? '저장 중…' : '저장'}
              </button>
              {selectedOrg?.hq_x !== null && (
                <button onClick={handleClear} disabled={isPending}
                  className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/5 disabled:opacity-50 cursor-pointer transition-colors">
                  거점 삭제
                </button>
              )}
              <button onClick={() => { setSelectedOrgId(null); setPendingCoords(null); setHqLabel('') }}
                className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 cursor-pointer transition-colors">
                취소
              </button>
            </div>
          </div>
        )}

        {selectedOrgId && !pendingCoords && selectedOrg?.hq_x !== null && (
          <div className="absolute bottom-4 right-4 z-[1000]">
            <button onClick={handleClear} disabled={isPending}
              className="rounded-lg border border-red-500/30 bg-zinc-900/90 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 cursor-pointer transition-colors backdrop-blur-sm">
              거점 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 작업 위치 탭 ────────────────────────────────────────

function LocationTab({ orgs, locations }: { orgs: AdminOrg[]; locations: AdminLocation[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 새 위치 추가 폼
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#facc15')
  const [newDesc, setNewDesc] = useState('')

  // 기존 위치 선택/편집
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null)

  // 위치 메타 편집
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [editColor, setEditColor] = useState('#facc15')
  const [editDesc, setEditDesc] = useState('')

  const selectedLocation = locations.find((l) => l.id === selectedId)
  const isPlacing = addingNew || !!selectedId

  function startAddNew() {
    setAddingNew(true); setSelectedId(null); setPendingCoords(null); setEditingId(null)
    setNewName(''); setNewLabel(''); setNewColor('#facc15'); setNewDesc('')
  }

  function cancelAdd() {
    setAddingNew(false); setPendingCoords(null)
  }

  function handleSelectLocation(loc: AdminLocation) {
    if (selectedId === loc.id) { setSelectedId(null); setPendingCoords(null); return }
    setAddingNew(false); setSelectedId(loc.id); setPendingCoords(null); setEditingId(null)
  }

  function handleSaveNew() {
    if (!newName.trim() || !pendingCoords) return
    startTransition(async () => {
      await addMapLocation({
        name: newName.trim(), label: newLabel.trim() || null,
        description: newDesc.trim() || null, color: newColor,
        x: pendingCoords.lng, y: pendingCoords.lat,
      })
      router.refresh(); setAddingNew(false); setPendingCoords(null)
      setNewName(''); setNewLabel(''); setNewColor('#facc15'); setNewDesc('')
    })
  }

  function handleMoveExisting() {
    if (!selectedId || !pendingCoords) return
    startTransition(async () => {
      await updateMapLocation(selectedId, { x: pendingCoords.lng, y: pendingCoords.lat })
      router.refresh(); setSelectedId(null); setPendingCoords(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteMapLocation(id)
      router.refresh()
      if (selectedId === id) { setSelectedId(null); setPendingCoords(null) }
      if (editingId === id) setEditingId(null)
    })
  }

  function startEdit(loc: AdminLocation) {
    setEditingId(loc.id); setEditName(loc.name); setEditLabel(loc.label ?? ''); setEditColor(loc.color); setEditDesc('')
    setSelectedId(null); setAddingNew(false); setPendingCoords(null)
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return
    startTransition(async () => {
      await updateMapLocation(editingId, { name: editName.trim(), label: editLabel.trim() || null, color: editColor })
      router.refresh(); setEditingId(null)
    })
  }

  // 임시 AdminLocation 배열 (새 위치 추가 중인 경우 프리뷰용 더미)
  const previewLocations: AdminLocation[] = addingNew && pendingCoords
    ? [...locations, { id: '__new__', name: newName || '새 위치', label: newLabel || null, color: newColor, x: pendingCoords.lng, y: pendingCoords.lat }]
    : locations

  return (
    <div className="flex h-full overflow-hidden">
      {/* 좌측: 위치 목록 */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-zinc-800 p-3 space-y-3">
        <button onClick={startAddNew}
          className="w-full rounded-lg border border-zinc-700 py-2 text-xs font-medium text-zinc-400 hover:border-amber-400/40 hover:text-amber-400 transition-colors cursor-pointer">
          + 새 위치 추가
        </button>

        {/* 새 위치 입력 폼 */}
        {addingNew && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 space-y-2">
            <p className="text-[11px] font-bold text-amber-400">새 위치</p>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="위치 이름 *"
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600" />
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="라벨 (예: 광산, 청소)"
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600" />
            <div className="flex items-center gap-2">
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent flex-shrink-0" />
              <span className="text-[10px] text-zinc-500">마커 색상</span>
            </div>
            <p className="text-[10px] text-zinc-500">
              {pendingCoords ? '아래 저장 버튼을 눌러주세요.' : '지도를 클릭해 위치를 찍어주세요.'}
            </p>
            <button onClick={cancelAdd}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors">
              취소
            </button>
          </div>
        )}

        {/* 기존 위치 목록 */}
        {locations.length === 0 && !addingNew && (
          <p className="text-xs text-zinc-600 text-center py-4">등록된 위치가 없습니다.</p>
        )}
        {locations.map((loc) => {
          const isSelected = selectedId === loc.id
          const isEditing = editingId === loc.id
          return (
            <div key={loc.id} className={`rounded-lg border transition-colors ${isSelected ? 'border-amber-400/30 bg-amber-400/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
              {isEditing ? (
                <div className="p-2.5 space-y-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none" />
                  <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="라벨"
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600" />
                  <div className="flex items-center gap-2">
                    <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)}
                      className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent" />
                    <span className="text-[10px] text-zinc-500">색상</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={handleSaveEdit} disabled={isPending}
                      className="flex-1 rounded bg-amber-400 py-1 text-[10px] font-semibold text-zinc-900 hover:bg-amber-300 disabled:opacity-50 cursor-pointer">저장</button>
                    <button onClick={() => setEditingId(null)}
                      className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-800 cursor-pointer">취소</button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5">
                  <button onClick={() => handleSelectLocation(loc)} className="w-full text-left cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: loc.color }} />
                      <span className="text-xs font-medium text-zinc-200 truncate flex-1">{loc.name}</span>
                      {loc.x !== null && <span className="text-[9px] text-green-500 font-medium">●</span>}
                    </div>
                    {loc.label && <p className="text-[10px] text-zinc-500 mt-0.5 ml-4">{loc.label}</p>}
                  </button>
                  <div className="flex gap-1 mt-1.5">
                    <button onClick={() => startEdit(loc)}
                      className="text-[10px] text-zinc-600 hover:text-zinc-300 cursor-pointer transition-colors">수정</button>
                    <span className="text-[10px] text-zinc-700">·</span>
                    <button onClick={() => handleDelete(loc.id)} disabled={isPending}
                      className="text-[10px] text-zinc-600 hover:text-red-400 cursor-pointer transition-colors">삭제</button>
                    {loc.x !== null && (
                      <>
                        <span className="text-[10px] text-zinc-700">·</span>
                        <button onClick={() => handleSelectLocation(loc)}
                          className="text-[10px] text-zinc-600 hover:text-amber-400 cursor-pointer transition-colors">위치 이동</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </aside>

      {/* 우측: 지도 */}
      <div className="relative flex-1 overflow-hidden">
        <AdminLeafletMap
          orgs={orgs}
          locations={previewLocations.filter((l) => l.id !== '__new__')}
          mode="location"
          selectedOrgId={null}
          selectedLocationId={selectedId}
          pendingCoords={pendingCoords}
          onMapClick={(lat, lng) => setPendingCoords({ lat, lng })}
        />

        {/* 안내 오버레이 */}
        {(addingNew || (selectedId && !pendingCoords)) && (
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full border border-amber-400/40 bg-zinc-900/90 px-4 py-2 text-xs text-amber-400 backdrop-blur-sm">
            {addingNew ? '지도를 클릭해 위치를 찍어주세요' : `${selectedLocation?.name}의 위치를 다시 클릭해 이동하세요`}
          </div>
        )}

        {/* 저장 패널 — 새 위치 */}
        {addingNew && pendingCoords && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-80 rounded-xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-xl space-y-3">
            <p className="text-sm font-bold text-white">{newName || '새 위치'} <span className="ml-1 text-xs font-normal text-zinc-500">위치 저장</span></p>
            {!newName.trim() && <p className="text-xs text-red-400">좌측 패널에서 이름을 먼저 입력해주세요.</p>}
            <p className="text-[10px] text-zinc-600">다시 클릭하면 위치를 변경할 수 있습니다</p>
            <div className="flex gap-2">
              <button onClick={handleSaveNew} disabled={isPending || !newName.trim()}
                className="flex-1 rounded bg-amber-400 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-300 disabled:opacity-50 cursor-pointer transition-colors">
                {isPending ? '저장 중…' : '저장'}
              </button>
              <button onClick={cancelAdd}
                className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 cursor-pointer transition-colors">취소</button>
            </div>
          </div>
        )}

        {/* 저장 패널 — 기존 위치 이동 */}
        {selectedId && pendingCoords && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-80 rounded-xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-xl space-y-3">
            <p className="text-sm font-bold text-white">{selectedLocation?.name} <span className="ml-1 text-xs font-normal text-zinc-500">위치 이동</span></p>
            <p className="text-[10px] text-zinc-600">다시 클릭하면 위치를 변경할 수 있습니다</p>
            <div className="flex gap-2">
              <button onClick={handleMoveExisting} disabled={isPending}
                className="flex-1 rounded bg-amber-400 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-300 disabled:opacity-50 cursor-pointer transition-colors">
                {isPending ? '저장 중…' : '저장'}
              </button>
              <button onClick={() => { setSelectedId(null); setPendingCoords(null) }}
                className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 cursor-pointer transition-colors">취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────

export default function AdminMapView({ orgs, locations }: { orgs: AdminOrg[]; locations: AdminLocation[] }) {
  const [tab, setTab] = useState<'org' | 'location'>('org')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 탭 */}
      <div className="flex shrink-0 border-b border-zinc-800">
        {([['org', '조직 거점'], ['location', '작업 위치']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              tab === key ? 'border-amber-400 text-amber-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'org'
          ? <OrgTab orgs={orgs} locations={locations} />
          : <LocationTab orgs={orgs} locations={locations} />
        }
      </div>
    </div>
  )
}
