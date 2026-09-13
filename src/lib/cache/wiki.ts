import { updateTag } from 'next/cache'

/** Public wiki data is refreshed immediately after an administrator changes it. */
export const WIKI_PUBLIC_TAG = 'wiki-public'
export const WIKI_CACHE_REVALIDATE = 60 * 60 * 24

export const WIKI_CACHE_TAGS = {
  characters: 'wiki-characters',
  streamers: 'wiki-streamers',
  organizations: 'wiki-organizations',
  events: 'wiki-events',
  map: 'wiki-map',
  relationships: 'wiki-relationships',
  reports: 'wiki-reports',
} as const

export type WikiCacheScope = keyof typeof WIKI_CACHE_TAGS

export function invalidateWikiCache() {
  updateTag(WIKI_PUBLIC_TAG)
}
