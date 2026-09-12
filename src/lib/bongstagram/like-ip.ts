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

  if (isIP(candidate) === 4) return candidate
  if (isIP(candidate) === 6) {
    const mappedIpv4 = candidate.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1]
    return mappedIpv4 && isIP(mappedIpv4) === 4 ? mappedIpv4 : candidate.toLowerCase()
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

export async function getBongstagramIpHash(): Promise<string | null> {
  const headerStore = await headers()
  const ip = findIp(headerStore.get('cf-connecting-ip'))
    ?? findIp(headerStore.get('true-client-ip'))
    ?? findIp(headerStore.get('x-real-ip'))
    ?? findIp(headerStore.get('x-vercel-forwarded-for'))
    ?? findIp(headerStore.get('x-forwarded-for'))
    ?? findIp(headerStore.get('forwarded')?.match(/(?:^|;)\s*for=([^;]+)/i)?.[1] ?? null)

  if (!ip) return null

  const secret = process.env.BONGSTAGRAM_IP_HASH_SECRET
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? 'bongstagram-like-ip'
  return createHash('sha256').update(`${secret}:${ip}`).digest('hex')
}
