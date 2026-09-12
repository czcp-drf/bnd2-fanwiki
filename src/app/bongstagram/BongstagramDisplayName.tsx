'use client'

import { useRedPill } from '@/lib/context/RedPillContext'

export default function BongstagramDisplayName({
  profileName,
  streamerName,
}: {
  profileName: string
  streamerName?: string | null
}) {
  const { isRedPill } = useRedPill()
  return <>{isRedPill && streamerName ? streamerName : profileName}</>
}
