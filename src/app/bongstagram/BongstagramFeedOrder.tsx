'use client'

import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { readBongstagramFollowingSnapshot } from '@/lib/bongstagram/following'

type FeedItem = { characterId: string; element: ReactNode }

function shuffle<T>(items: T[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function orderItems(items: FeedItem[], following: string[]) {
  if (following.length === 0) return items
  const followingSet = new Set(following)
  const followed = items.filter((item) => followingSet.has(item.characterId))
  const others = shuffle(items.filter((item) => !followingSet.has(item.characterId)))
  if (followed.length === 0) return shuffle(items)

  const result: FeedItem[] = []
  followed.forEach((item, index) => {
    result.push(item)
    if ((index + 1) % 2 === 0 && others.length > 0) result.push(others.shift()!)
  })
  result.push(...others)
  return result
}

export default function BongstagramFeedOrder({ items }: { items: FeedItem[] }) {
  const followingSnapshot = useSyncExternalStore(
    () => () => {},
    readBongstagramFollowingSnapshot,
    () => '[]',
  )
  const following = useMemo(() => {
    try {
      const value: unknown = JSON.parse(followingSnapshot)
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
    } catch {
      return []
    }
  }, [followingSnapshot])
  const orderedItems = useMemo(() => orderItems(items, following), [items, following])

  return <>{orderedItems.map((item) => item.element)}</>
}
