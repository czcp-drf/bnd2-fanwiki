'use client'

import AppImage from '@/components/ui/AppImage'
import { useRedPill } from '@/lib/context/RedPillContext'

export default function BongstagramProfileAvatar({
  profileAvatarUrl,
  streamerAvatarUrl,
  fallbackAvatarUrl,
  profileName,
  streamerName,
  fallbackText,
  className,
}: {
  profileAvatarUrl?: string | null
  streamerAvatarUrl?: string | null
  fallbackAvatarUrl?: string | null
  profileName: string
  streamerName?: string | null
  fallbackText?: string
  className?: string
}) {
  const { isRedPill } = useRedPill()
  const avatarUrl = (isRedPill ? streamerAvatarUrl : profileAvatarUrl) ?? profileAvatarUrl ?? fallbackAvatarUrl
  const displayName = isRedPill && streamerName ? streamerName : profileName

  return avatarUrl
    ? <AppImage src={avatarUrl} alt={displayName} className={className} />
    : <>{fallbackText ?? displayName.slice(0, 1)}</>
}
