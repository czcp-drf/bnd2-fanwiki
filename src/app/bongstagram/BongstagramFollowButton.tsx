'use client'

import { useSyncExternalStore } from 'react'
import { BONGSTAGRAM_FOLLOWING_EVENT, readBongstagramFollowing, writeBongstagramFollowing } from '@/lib/bongstagram/following'

function subscribeFollowing(callback: () => void) {
  window.addEventListener(BONGSTAGRAM_FOLLOWING_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(BONGSTAGRAM_FOLLOWING_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export default function BongstagramFollowButton({ characterId }: { characterId: string }) {
  const following = useSyncExternalStore(
    subscribeFollowing,
    () => readBongstagramFollowing().includes(characterId),
    () => false,
  )

  function toggle() {
    const current = readBongstagramFollowing()
    writeBongstagramFollowing(following ? current.filter((id) => id !== characterId) : [...current, characterId])
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={following} className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${following ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-sky-500 !text-white hover:bg-sky-400'}`}>
      {following ? '팔로잉' : '팔로우'}
    </button>
  )
}
