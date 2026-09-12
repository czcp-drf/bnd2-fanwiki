'use client'

import { useRef } from 'react'
import { addStreamer } from './actions'
import { useAdminMutation } from '@/lib/admin/useAdminMutation'
import { unwrapMutation } from '@/lib/admin/mutation'

export default function StreamerAddForm() {
  const ref = useRef<HTMLFormElement>(null)
  const [pending, run, error] = useAdminMutation()
  return (
      <form ref={ref} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); run(async () => { await unwrapMutation(addStreamer(data)); ref.current?.reset() }) }} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <fieldset disabled={pending}>
        <p className="text-xs font-semibold text-zinc-400 mb-3">스트리머 추가</p>
        <div className="flex flex-wrap gap-2">
          <input
            name="display_name"
            placeholder="표시 이름"
            required
            className="w-32 rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600"
          />
          <input
            name="chzzk_channel_id"
            placeholder="치지직 채널 ID"
            required
            className="w-72 rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600"
          />
          <input
            name="profile_image_url"
            placeholder="프로필 이미지 URL (선택)"
            className="flex-1 min-w-48 rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-400/50 focus:outline-none placeholder:text-zinc-600"
          />
          <button
            type="submit"
            className="rounded bg-amber-400 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            {pending ? '추가 중…' : '추가'}
          </button>
        </div>
        </fieldset>
        {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
      </form>
  )
}
