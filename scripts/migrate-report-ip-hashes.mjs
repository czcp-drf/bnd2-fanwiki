import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { createClient } from '@supabase/supabase-js'

function normalizeIp(value) {
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
    if (mappedIpv4 && isIP(mappedIpv4) === 4) {
      return mappedIpv4 === '127.0.0.1' ? 'localhost' : mappedIpv4
    }
    return candidate === '::1' ? 'localhost' : candidate.toLowerCase()
  }
  return null
}

function hashStoredIp(value, secret) {
  const ip = normalizeIp(value)
  return ip ? createHash('sha256').update(`${secret}:${ip}`).digest('hex') : null
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')
}

const secret = process.env.IP_HASH_SECRET
  ?? process.env.BONGSTAGRAM_IP_HASH_SECRET
  ?? serviceRoleKey
  ?? 'bongstagram-like-ip'
const supabase = createClient(url, serviceRoleKey)

const [{ data: reports, error: reportsError }, { data: blockedIps, error: blockedError }] = await Promise.all([
  supabase.from('reports').select('id, ip').not('ip', 'is', null),
  supabase.from('blocked_ips').select('id, ip').not('ip', 'is', null),
])

if (reportsError) throw new Error(`reports 조회 실패: ${reportsError.message}`)
if (blockedError) throw new Error(`blocked_ips 조회 실패: ${blockedError.message}`)

let skipped = 0
for (const report of reports ?? []) {
  const ipHash = hashStoredIp(report.ip, secret)
  if (!ipHash) {
    skipped += 1
    continue
  }
  const { error } = await supabase.from('reports').update({ ip_hash: ipHash }).eq('id', report.id)
  if (error) throw new Error(`reports ${report.id} 갱신 실패: ${error.message}`)
}

for (const blocked of blockedIps ?? []) {
  const ipHash = hashStoredIp(blocked.ip, secret)
  if (!ipHash) {
    skipped += 1
    continue
  }
  const { error } = await supabase.from('blocked_ips').update({ ip_hash: ipHash }).eq('id', blocked.id)
  if (error) throw new Error(`blocked_ips ${blocked.id} 갱신 실패: ${error.message}`)
}

console.log(`reports ${reports?.length ?? 0}건, blocked_ips ${blockedIps?.length ?? 0}건의 IP 해시 백필을 완료했습니다.`)
if (skipped > 0) console.warn(`유효한 IP가 아니어서 건너뛴 행: ${skipped}건`)
console.log('검증 후 legacy ip 컬럼을 제거하는 정리 migration을 적용하세요.')
