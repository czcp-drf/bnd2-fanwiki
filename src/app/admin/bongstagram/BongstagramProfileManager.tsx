'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Image as ImageIcon, Pencil, Plus, Trash2, X } from 'lucide-react'
import Select, { type SelectOption } from '@/components/ui/Select'
import { deleteBongstagramProfile, upsertBongstagramProfile } from './actions'

type Character = {
  id: string
  name: string
  job: string | null
  status: string
  avatar_url: string | null
  streamers: { display_name: string } | null
  organization_members: {
    organization_id: string
    is_primary: boolean
    organizations: Organization | null
  }[]
}

type Organization = {
  id: string
  name: string
  color: string | null
  category: string | null
}

type ProfileConnectionFilter = 'unconnected' | 'all' | 'connected'

type Profile = {
  character_id: string
  profile_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

const statusLabel: Record<string, string> = {
  active: '활동',
  dead: '사망',
  retired: '활동 종료',
  hiatus: '휴식',
}

const categoryLabel: Record<string, string> = {
  city_hall: '시청',
  public_service: '공무직',
  gang: '갱단',
  business: '사업체',
  illegal: '불법',
}

const categoryOrder = ['city_hall', 'public_service', 'gang', 'business', 'illegal']

function buildOrganizationOptions(organizations: Organization[]): SelectOption[] {
  const grouped = new Map<string, Organization[]>()
  for (const organization of organizations) {
    const category = organization.category ?? 'other'
    const group = grouped.get(category) ?? []
    group.push(organization)
    grouped.set(category, group)
  }

  const options: SelectOption[] = [
    { value: '', label: '전체 조직' },
    { value: '__none__', label: '무소속' },
  ]
  const orderedCategories = [
    ...categoryOrder,
    ...Array.from(grouped.keys()).filter((category) => !categoryOrder.includes(category)),
  ]

  for (const category of orderedCategories) {
    const group = grouped.get(category)
    if (!group?.length) continue
    options.push({ separator: true, label: categoryLabel[category] ?? category })
    for (const organization of group) {
      options.push({ value: organization.id, label: organization.name })
    }
  }

  return options
}

function ProfileFields({
  profileName,
  avatarUrl,
  bio,
  disabled,
  onProfileNameChange,
  onAvatarUrlChange,
  onBioChange,
}: {
  profileName: string
  avatarUrl: string
  bio: string
  disabled: boolean
  onProfileNameChange: (value: string) => void
  onAvatarUrlChange: (value: string) => void
  onBioChange: (value: string) => void
}) {
  const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none disabled:opacity-50'

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <label className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-500">프로필 이름 <span className="text-fuchsia-400">*</span></span>
        <input
          value={profileName}
          maxLength={40}
          disabled={disabled}
          onChange={(event) => onProfileNameChange(event.target.value)}
          placeholder="SNS에 표시할 닉네임"
          className={inputClass}
        />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-500">프로필 이미지 주소</span>
        <input
          value={avatarUrl}
          disabled={disabled}
          onChange={(event) => onAvatarUrlChange(event.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </label>
      <label className="space-y-1.5 md:col-span-1">
        <span className="text-xs font-medium text-zinc-500">소개글</span>
        <textarea
          value={bio}
          maxLength={150}
          disabled={disabled}
          onChange={(event) => onBioChange(event.target.value)}
          placeholder="프로필 소개 (선택)"
          rows={1}
          className={`${inputClass} resize-none`}
        />
      </label>
    </div>
  )
}

function CharacterSummary({ character }: { character: Character }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
        {character.name.slice(0, 1)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{character.name}</p>
        <p className="truncate text-xs text-zinc-500">
          {character.streamers?.display_name ?? '스트리머 없음'} · {statusLabel[character.status] ?? character.status}
        </p>
      </div>
    </div>
  )
}

function NewProfileForm({ characters }: { characters: Character[] }) {
  const router = useRouter()
  const [characterId, setCharacterId] = useState('')
  const [profileName, setProfileName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save() {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await upsertBongstagramProfile({ characterId, profileName, avatarUrl, bio })
      if (result.error) {
        setError(result.error)
        return
      }
      setMessage('프로필이 등록되었습니다.')
      setCharacterId('')
      setProfileName('')
      setAvatarUrl('')
      setBio('')
      router.refresh()
    })
  }

  const options = characters.map((character) => ({
    value: character.id,
    label: `${character.name} · ${character.streamers?.display_name ?? '스트리머 없음'}`,
  }))

  return (
    <section className="rounded-xl border border-fuchsia-400/20 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Plus size={16} className="text-fuchsia-400" />
        <h2 className="text-sm font-bold text-white">프로필 등록</h2>
      </div>
      {characters.length === 0 ? (
        <p className="text-sm text-zinc-500">등록 가능한 캐릭터가 없습니다. 이미 모든 캐릭터에 프로필이 연결되었거나 캐릭터가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          <div className="max-w-md">
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">연결할 캐릭터</label>
            <Select
              value={characterId}
              onChange={setCharacterId}
              options={options}
              placeholder="캐릭터 선택"
              searchPlaceholder="캐릭터명 또는 스트리머명 검색"
              searchable
              fullWidth
              disabled={pending}
            />
          </div>
          <ProfileFields
            profileName={profileName}
            avatarUrl={avatarUrl}
            bio={bio}
            disabled={pending}
            onProfileNameChange={setProfileName}
            onAvatarUrlChange={setAvatarUrl}
            onBioChange={setBio}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={pending || !characterId || !profileName.trim()}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-fuchsia-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={13} />
              {pending ? '저장 중...' : '등록'}
            </button>
            {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
            {message && <p role="status" className="text-xs text-emerald-400">{message}</p>}
          </div>
        </div>
      )}
    </section>
  )
}

function ProfileEditRow({ profile, character }: { profile: Profile; character: Character }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [profileName, setProfileName] = useState(profile.profile_name)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await upsertBongstagramProfile({ characterId: profile.character_id, profileName, avatarUrl, bio })
      if (result.error) {
        setError(result.error)
        return
      }
      setMessage('저장 완료')
      setEditing(false)
      router.refresh()
    })
  }

  function remove() {
    if (!window.confirm(`${character.name}의 Bongstagram 프로필을 삭제할까요?`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteBongstagramProfile(profile.character_id)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  function cancel() {
    setProfileName(profile.profile_name)
    setAvatarUrl(profile.avatar_url ?? '')
    setBio(profile.bio ?? '')
    setError(null)
    setMessage(null)
    setEditing(false)
  }

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CharacterSummary character={character} />
        <div className="flex items-center gap-2">
          {message && <span role="status" className="text-xs text-emerald-400">{message}</span>}
          {!editing && (
            <button type="button" onClick={() => { setError(null); setMessage(null); setEditing(true) }} className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200">
              <Pencil size={12} />
              수정
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <ProfileFields
            profileName={profileName}
            avatarUrl={avatarUrl}
            bio={bio}
            disabled={pending}
            onProfileNameChange={setProfileName}
            onAvatarUrlChange={setAvatarUrl}
            onBioChange={setBio}
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={save} disabled={pending || !profileName.trim()} className="flex cursor-pointer items-center gap-1 rounded-lg bg-fuchsia-400 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-40">
              <Check size={12} />
              {pending ? '저장 중...' : '저장'}
            </button>
            <button type="button" onClick={cancel} disabled={pending} className="flex cursor-pointer items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-40">
              <X size={12} />
              취소
            </button>
            <button type="button" onClick={remove} disabled={pending} className="ml-auto flex cursor-pointer items-center gap-1 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-40">
              <Trash2 size={12} />
              삭제
            </button>
          </div>
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 border-t border-zinc-800 pt-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-[11px] text-zinc-600">프로필 이름</p>
            <p className="mt-1 font-medium text-zinc-200">{profile.profile_name}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-600">프로필 이미지</p>
            <p className="mt-1 truncate text-zinc-400">{profile.avatar_url ? <span className="inline-flex items-center gap-1"><ImageIcon size={13} /> 등록됨</span> : '미등록'}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-600">소개</p>
            <p className="mt-1 line-clamp-2 text-zinc-400">{profile.bio || '—'}</p>
          </div>
        </div>
      )}
    </article>
  )
}

function UnconnectedCharacterRow({ character }: { character: Character }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await upsertBongstagramProfile({
        characterId: character.id,
        profileName,
        avatarUrl,
        bio,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  function cancel() {
    setProfileName('')
    setAvatarUrl('')
    setBio('')
    setError(null)
    setEditing(false)
  }

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CharacterSummary character={character} />
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500">Bongstagram 미연결</span>
          {!editing && (
            <button
              type="button"
              onClick={() => { setError(null); setEditing(true) }}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            >
              <Pencil size={12} />
              수정
            </button>
          )}
        </div>
      </div>
      {editing && (
        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <ProfileFields
            profileName={profileName}
            avatarUrl={avatarUrl}
            bio={bio}
            disabled={pending}
            onProfileNameChange={setProfileName}
            onAvatarUrlChange={setAvatarUrl}
            onBioChange={setBio}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending || !profileName.trim()}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-fuchsia-400 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={12} />
              {pending ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-40"
            >
              <X size={12} />
              취소
            </button>
          </div>
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </article>
  )
}

export default function BongstagramProfileManager({
  characters,
  profiles,
  organizations,
  availableCharacterIds,
}: {
  characters: Character[]
  profiles: Profile[]
  organizations: Organization[]
  availableCharacterIds: string[]
}) {
  const available = new Set(availableCharacterIds)
  const profileByCharacterId = new Map(profiles.map((profile) => [profile.character_id, profile]))
  const [organizationId, setOrganizationId] = useState('')
  const [connectionFilter, setConnectionFilter] = useState<ProfileConnectionFilter>('all')

  const organizationOptions = buildOrganizationOptions(organizations)
  const filteredCharacters = characters.filter((character) => {
    const isConnected = !available.has(character.id)
    if (connectionFilter === 'unconnected' && isConnected) return false
    if (connectionFilter === 'connected' && !isConnected) return false
    if (organizationId === '__none__') return character.organization_members.length === 0
    if (organizationId && !character.organization_members.some((member) => member.organization_id === organizationId)) return false
    return true
  })
  const filteredAvailableCharacters = filteredCharacters.filter((character) => available.has(character.id))

  return (
    <div className="space-y-6">
      <NewProfileForm characters={filteredAvailableCharacters} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">캐릭터별 프로필</h2>
            <p className="mt-1 text-xs text-zinc-500">{filteredCharacters.length}명 표시 · 프로필 연결 여부를 확인할 수 있습니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={organizationId}
              onChange={setOrganizationId}
              options={organizationOptions}
              placeholder="조직 선택"
              searchPlaceholder="조직 검색"
              searchable
            />
            <div className="flex items-center rounded-lg border border-zinc-800 p-0.5" role="group" aria-label="Bongstagram 연결 상태 필터">
              {([
                ['unconnected', '미연결자만 보기'],
                ['all', '미연결자+연결자 모두 보기'],
                ['connected', '연결자만 보기'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setConnectionFilter(value)}
                  aria-pressed={connectionFilter === value}
                  className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    connectionFilter === value
                      ? 'bg-fuchsia-400/15 text-fuchsia-300'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {filteredCharacters.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-12 text-center text-sm text-zinc-600">조건에 맞는 캐릭터가 없습니다.</div>
        ) : (
          filteredCharacters.map((character) => {
            const profile = profileByCharacterId.get(character.id)
            return profile
              ? <ProfileEditRow key={character.id} profile={profile} character={character} />
              : <UnconnectedCharacterRow key={character.id} character={character} />
          })
        )}
      </section>
    </div>
  )
}
