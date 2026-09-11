export type LiveStatus = { live: boolean | null; title: string | null }
export type LiveMap = Record<string, LiveStatus>

export function parseLiveStatus(value: unknown): LiveStatus {
  if (typeof value === 'boolean') return { live: value, title: null }
  if (value && typeof value === 'object' && 'live' in value) {
    return {
      live: typeof value.live === 'boolean' ? value.live : null,
      title: 'title' in value && typeof value.title === 'string' ? value.title : null,
    }
  }
  return { live: null, title: null }
}

export async function checkChannelLive(channelId: string, request: typeof fetch = fetch): Promise<LiveStatus> {
  for (const version of ['v3.3', 'v2']) {
    try {
      const response = await request(`https://api.chzzk.naver.com/service/${version}/channels/${channelId}/live-detail`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) continue
      const data = await response.json()
      const content = data?.content
      const status = content?.status ?? content?.livePollingStatus?.status
      if (!['OPEN', 'CLOSE', 'CLOSED'].includes(status)) continue
      return { live: status === 'OPEN', title: status === 'OPEN' && typeof content?.liveTitle === 'string' ? content.liveTitle : null }
    } catch {
      // A failed endpoint must not prevent the fallback from running.
    }
  }
  return { live: null, title: null }
}
