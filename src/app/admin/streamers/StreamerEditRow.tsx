'use client'

import { useState } from 'react'
import { useAdminMutation } from '@/lib/admin/useAdminMutation'
import { unwrapMutation } from '@/lib/admin/mutation'
import * as actions from './actions'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'

const updateStreamer = (...args: Parameters<typeof actions.updateStreamer>) => unwrapMutation(actions.updateStreamer(...args))
const deleteStreamer = (...args: Parameters<typeof actions.deleteStreamer>) => unwrapMutation(actions.deleteStreamer(...args))

type Streamer = {
  id: string
  chzzk_channel_id: string
  display_name: string
  profile_image_url: string | null
  is_active: boolean
  created_at: string
}

export default function StreamerEditRow({ streamer }: { streamer: Streamer }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [channelId, setChannelId] = useState(streamer.chzzk_channel_id)
  const [displayName, setDisplayName] = useState(streamer.display_name)
  const [profileImageUrl, setProfileImageUrl] = useState(streamer.profile_image_url ?? '')
  const [isActive, setIsActive] = useState(streamer.is_active)
  const [saving, runSave, saveError] = useAdminMutation()
  const [deleting, runDelete, deleteError] = useAdminMutation()

  function save() {
    runSave(async () => {
      await updateStreamer(streamer.id, {
        chzzk_channel_id: channelId.trim() || streamer.chzzk_channel_id,
        display_name: displayName.trim() || streamer.display_name,
        profile_image_url: profileImageUrl.trim() || null,
        is_active: isActive,
      })
      setEditing(false)
    })
  }

  function handleDelete() {
    runDelete(async () => {
      await deleteStreamer(streamer.id)
    })
  }

  function cancel() {
    setChannelId(streamer.chzzk_channel_id)
    setDisplayName(streamer.display_name)
    setProfileImageUrl(streamer.profile_image_url ?? '')
    setIsActive(streamer.is_active)
    setConfirmDelete(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="border-t border-zinc-800 bg-zinc-800/30 align-top">
        <td className="px-4 py-2.5">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
          />
        </td>
        <td className="px-4 py-2.5">
          <input
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
          />
        </td>
        <td className="px-4 py-2.5">
          <input
            value={profileImageUrl}
            onChange={(e) => setProfileImageUrl(e.target.value)}
            placeholder="이미지 URL (선택)"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none"
          />
        </td>
        <td className="px-4 py-2.5">
          <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-amber-400"
            />
            활성
          </label>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1 whitespace-nowrap">
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
          {(saveError || deleteError) && <p role="alert" className="mt-2 text-xs text-red-400">{saveError || deleteError}</p>}
        </td>
    </tr>
    )
  }

  return (
    <tr className="border-t border-zinc-800 hover:bg-zinc-800/20 transition-colors">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {streamer.profile_image_url ? (
            <AppImage
              src={streamer.profile_image_url}
              alt={streamer.display_name}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-zinc-700" />
          )}
          <span className={`text-xs font-medium ${streamer.is_active ? 'text-white' : 'text-zinc-500'}`}>
            {streamer.display_name}
          </span>
        </div>
      </td>
      <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">{streamer.chzzk_channel_id}</td>
      <td className="px-4 py-2.5 text-xs text-zinc-500 truncate">
        {streamer.profile_image_url
          ? <span className="text-zinc-400 truncate">{streamer.profile_image_url}</span>
          : <span className="text-zinc-700">없음</span>}
      </td>
      <td className="px-4 py-2.5">
        <span className={`text-xs ${streamer.is_active ? 'text-green-400' : 'text-zinc-600'}`}>
          {streamer.is_active ? '활성' : '비활성'}
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
