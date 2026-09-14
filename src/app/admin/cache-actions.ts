'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { WIKI_CACHE_TAGS, type WikiCacheScope } from '@/lib/cache/wiki'

const scopes = new Set<WikiCacheScope>(Object.keys(WIKI_CACHE_TAGS) as WikiCacheScope[])

const publicPaths: Record<WikiCacheScope, string[]> = {
  characters: ['/', '/characters', '/characters/[id]', '/search'],
  streamers: ['/', '/streamers', '/streamers/[id]', '/search'],
  organizations: ['/', '/organizations', '/organizations/[id]', '/events/timeline', '/search'],
  events: ['/', '/events', '/events/[id]', '/events/timeline', '/search'],
  map: ['/map'],
  relationships: ['/characters/[id]'],
  reports: ['/report'],
}

const adminPaths: Record<WikiCacheScope, string[]> = {
  characters: ['/admin/characters'],
  streamers: ['/admin/streamers'],
  organizations: ['/admin/organizations', '/admin/organizations/[id]'],
  events: ['/admin/events', '/admin/events/[id]/edit'],
  map: ['/admin/map'],
  relationships: ['/admin/relationships'],
  reports: ['/admin/reports', '/admin/blocked-ips'],
}

export async function refreshWikiCache(scope: WikiCacheScope): Promise<{ success?: true; error?: string }> {
  await requireAdmin()
  if (!scopes.has(scope)) return { error: '알 수 없는 캐시 영역입니다.' }

  updateTag(WIKI_CACHE_TAGS[scope])
  for (const path of publicPaths[scope]) {
    revalidatePath(path, path.includes('[') ? 'page' : undefined)
  }
  for (const path of adminPaths[scope]) {
    revalidatePath(path, path.includes('[') ? 'page' : undefined)
  }
  return { success: true }
}
