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

function findIp(value: string | null): string | null {
  if (!value) return null
  for (const part of value.split(',')) {
    const ip = normalizeIp(part)
    if (ip) return ip
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
  const headerStore = await headers()
  const ip = findIp(headerStore.get('cf-connecting-ip'))
    ?? findIp(headerStore.get('true-client-ip'))
    ?? findIp(headerStore.get('x-real-ip'))
    ?? findIp(headerStore.get('x-vercel-forwarded-for'))
    ?? findIp(headerStore.get('x-forwarded-for'))
    ?? findIp(headerStore.get('forwarded')?.match(/(?:^|;)\s*for=([^;]+)/i)?.[1] ?? null)

  if (!ip) return null
  return hashNormalizedIp(ip)
}

// 기존 호출부 호환용 이름
export const getBongstagramIpHash = getClientIpHash
