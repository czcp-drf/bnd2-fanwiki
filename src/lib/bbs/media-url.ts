const EXTERNAL_SOURCE_HOST_PATTERN = /(?:^|\.)fivemanage\.com$/i
const STORAGE_VIDEO_PATH_PATTERN = /\/storage\/v1\/object\/public\/bbs-media\/articles\/[^/]+\/[^/]+\.(?:webm|mp4|mov)(?:$|\?)/i

function normalizeHttpUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return ['http:', 'https:'].includes(url.protocol) ? url : null
  } catch {
    return null
  }
}

export function isAllowedBbsVideoUrl(value: string) {
  const url = normalizeHttpUrl(value)
  if (!url || url.protocol !== 'https:') return false
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      if (url.origin === new URL(supabaseUrl).origin && STORAGE_VIDEO_PATH_PATTERN.test(url.pathname + url.search)) return true
    } catch {
      return false
    }
  }
  if (!EXTERNAL_SOURCE_HOST_PATTERN.test(url.hostname)) return false
  return /^\/[^?]+\/phone\.videos\/[^/]+\.(?:webm|mp4|mov)(?:$|\?)/i.test(url.pathname + url.search)
}

export function isHttpUrl(value: string) {
  return Boolean(normalizeHttpUrl(value))
}
