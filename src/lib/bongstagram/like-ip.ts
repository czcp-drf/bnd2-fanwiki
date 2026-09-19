import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { headers } from 'next/headers'

function normalizeIp(value: string): string | null {
  let candidate = value.trim().replace(/^for=/i, '').replace(/^"|"$/g, '')
  if (!candidate) return null

  if (candidate.startsWith('[')) {
    const closingBracket = candidate.indexOf(']')
    if (closingBracket > 0) candidate = candidate.slice(1, closingBracket)
  } else if (isIP(candidate) === 0) {
    const lastColon = candidate.lastIndexOf(':')
    const possibleIp = lastColon > 0 ? candidate.slice(0, lastColon) : ''
    if (isIP(possibleIp) > 0) candidate = possibleIp
  }

  if (isIP(candidate) === 4) return candidate === '127.0.0.1' ? 'localhost' : candidate
  if (isIP(candidate) === 6) {
    const mappedIpv4 = candidate.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1]
    if (mappedIpv4 && isIP(mappedIpv4) === 4) return mappedIpv4 === '127.0.0.1' ? 'localhost' : mappedIpv4
    return candidate === '::1' ? 'localhost' : candidate.toLowerCase()
  }
  return null
}

function getIpHashSecret(): string {
  return process.env.IP_HASH_SECRET
    ?? process.env.BONGSTAGRAM_IP_HASH_SECRET
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? 'bongstagram-like-ip'
}

export function hashNormalizedIp(ip: string): string {
  return createHash('sha256').update(`${getIpHashSecret()}:${ip}`).digest('hex')
}

export function hashStoredIp(value: string): string | null {
  const ip = normalizeIp(value)
  return ip ? hashNormalizedIp(ip) : null
}

export async function getClientIpHash(): Promise<string | null> {
  // 개발 환경에서는 요청 헤더 대신 로컬 전용 식별자를 사용합니다.
  if (process.env.VERCEL !== '1') {
    return process.env.NODE_ENV === 'development' ? hashNormalizedIp('localhost') : null
  }

  // Vercel이 설정한 헤더만 사용하며 임의의 프록시 헤더로 대체하지 않습니다.
  const headerStore = await headers()
  const value = headerStore.get('x-vercel-forwarded-for') ?? headerStore.get('x-forwarded-for')
  // 단일 IP만 허용하고 모호한 체인이나 포트가 포함된 값은 거절합니다.
  if (!value || !isIP(value.trim())) return null
  const ip = normalizeIp(value)

  if (!ip) return null
  return hashNormalizedIp(ip)
}

// 기존 호출부 호환용 이름
export const getBongstagramIpHash = getClientIpHash
