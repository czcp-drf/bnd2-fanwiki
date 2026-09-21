const EXTERNAL_SOURCE_HOST_PATTERN = /(?:^|\.)fivemanage\.com$/i

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
  if (!EXTERNAL_SOURCE_HOST_PATTERN.test(url.hostname)) return false
  return /^\/[^?]+\/phone\.videos\/[^/]+\.(?:webm|mp4|mov)(?:$|\?)/i.test(url.pathname + url.search)
}

export function isHttpUrl(value: string) {
  return Boolean(normalizeHttpUrl(value))
}
