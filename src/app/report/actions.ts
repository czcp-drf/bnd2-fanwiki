'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClientIpHash } from '@/lib/bongstagram/like-ip'
import { MAP_MAX_BOUNDS } from '@/lib/map/constants'
import type { Database } from '@/types/database'

async function isBlocked(ipHash: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('blocked_ips')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
  return (count ?? 0) > 0
}

export type ReportFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

const ALLOWED_TYPES = ['new_character', 'new_event', 'correction', 'other'] as const
const REPORT_RATE_LIMIT_WINDOW_MS = 30000
const MAX_CHARACTER_REPORTS = 30
const MAX_CHARACTER_REPORT_LENGTH = 100
const MAX_CLIP_REPORTS = 5
const MAX_CLIP_REPORT_LENGTH = 500
const MAX_STREAMER_REPORT_LENGTH = 100

function isReportType(value: string): value is (typeof ALLOWED_TYPES)[number] {
  return (ALLOWED_TYPES as readonly string[]).includes(value)
}

function getString(formData: FormData, key: string): string {
  const val = formData.get(key)
  return typeof val === 'string' ? val : ''
}

function hasNonStringValue(formData: FormData, keys: string[]): boolean {
  return keys.some((key) => {
    const value = formData.get(key)
    return value !== null && typeof value !== 'string'
  })
}

function getStringValues(formData: FormData, key: string): string[] | null {
  const values = formData.getAll(key)
  const stringValues: string[] = []

  for (const value of values) {
    if (typeof value !== 'string') return null
    stringValues.push(value.trim())
  }

  return stringValues.filter(Boolean)
}

function isSafeReferenceUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

export async function submitReport(
  _prev: ReportFormState,
  formData: FormData
): Promise<ReportFormState> {
  // 허니팟 체크 — 봇이 채우면 차단
  if (getString(formData, '_hp')) {
    return { status: 'success' } // 봇에게는 성공처럼 보이게
  }

  // 차단된 IP 체크
  const ipHash = await getClientIpHash()
  if (ipHash && await isBlocked(ipHash)) {
    return { status: 'error', message: '제보가 제한된 환경입니다.' }
  }

  const type = getString(formData, 'type')
  const title = getString(formData, 'title')
  const content = getString(formData, 'content')
  const contact = getString(formData, 'contact')
  const contact_method = getString(formData, 'contact_method')
  const reference_url = getString(formData, 'reference_url')
  const map_x = getString(formData, 'map_x')
  const map_y = getString(formData, 'map_y')
  const streamer_report = getString(formData, 'streamer_report')
  const character_reports = getStringValues(formData, 'character_report')
  const clip_reports = getStringValues(formData, 'clip_report')

  if (
    hasNonStringValue(formData, [
      'type', 'title', 'content', 'contact', 'contact_method', 'reference_url',
      'map_x', 'map_y', 'streamer_report',
    ]) ||
    character_reports === null ||
    clip_reports === null
  ) {
    return { status: 'error', message: '올바르지 않은 제보 형식입니다.' }
  }

  if (!type || !title || !content) {
    return { status: 'error', message: '유형, 제목, 내용은 필수 항목입니다.' }
  }

  if (!isReportType(type)) {
    return { status: 'error', message: '올바르지 않은 제보 유형입니다.' }
  }

  if (title.trim().length === 0) {
    return { status: 'error', message: '제목을 입력해주세요.' }
  }

  if (title.length > 100) {
    return { status: 'error', message: '제목은 100자 이내로 입력해주세요.' }
  }

  if (content.trim().length === 0) {
    return { status: 'error', message: '내용을 입력해주세요.' }
  }

  if (content.length > 2000) {
    return { status: 'error', message: '내용은 2000자 이내로 입력해주세요.' }
  }

  if (contact.length > 200) {
    return { status: 'error', message: '연락처는 200자 이내로 입력해주세요.' }
  }

  if (contact_method.length > 100) {
    return { status: 'error', message: '연락 방법은 100자 이내로 입력해주세요.' }
  }

  if (streamer_report.length > MAX_STREAMER_REPORT_LENGTH) {
    return { status: 'error', message: '스트리머 이름은 100자 이내로 입력해주세요.' }
  }

  if (character_reports.length > MAX_CHARACTER_REPORTS) {
    return { status: 'error', message: `참여 인물은 ${MAX_CHARACTER_REPORTS}명까지 선택할 수 있습니다.` }
  }

  if (character_reports.some((name) => name.length > MAX_CHARACTER_REPORT_LENGTH)) {
    return { status: 'error', message: '참여 인물 이름은 100자 이내로 입력해주세요.' }
  }

  if (clip_reports.length > MAX_CLIP_REPORTS) {
    return { status: 'error', message: `클립 링크는 ${MAX_CLIP_REPORTS}개까지 입력할 수 있습니다.` }
  }

  if (clip_reports.some((url) => url.length > MAX_CLIP_REPORT_LENGTH || !isSafeReferenceUrl(url))) {
    return { status: 'error', message: '클립 링크는 http 또는 https URL을 500자 이내로 입력해주세요.' }
  }

  const trimmedReferenceUrl = reference_url.trim()
  if (trimmedReferenceUrl.length > 500) {
    return { status: 'error', message: '참고 링크는 500자 이내로 입력해주세요.' }
  }

  if (trimmedReferenceUrl && !isSafeReferenceUrl(trimmedReferenceUrl)) {
    return { status: 'error', message: '참고 링크는 http 또는 https URL이어야 합니다.' }
  }

  const extras: string[] = []

  if (type === 'new_character' && streamer_report.trim()) {
    extras.push(`[빨간약] ${streamer_report.trim()}`)
  }
  if (type === 'new_event') {
    if (character_reports.length > 0) {
      extras.push(`[참여 인물] ${character_reports.join(', ')}`)
    }
    if (clip_reports.length > 0) {
      extras.push(`[클립 링크]\n${clip_reports.map(u => `- ${u}`).join('\n')}`)
    }
  }

  const hasAnyCoords = Boolean(map_x.trim() || map_y.trim())
  if (hasAnyCoords) {
    const x = Number(map_x)
    const y = Number(map_y)
    const [[minY, minX], [maxY, maxX]] = MAP_MAX_BOUNDS

    if (
      !map_x.trim() ||
      !map_y.trim() ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < minX ||
      x > maxX ||
      y < minY ||
      y > maxY
    ) {
      return { status: 'error', message: '지도 좌표가 올바르지 않습니다.' }
    }

    extras.push(`[지도 좌표] X: ${x.toFixed(1)}, Y: ${y.toFixed(1)}`)
  }

  const fullContent = extras.length > 0
    ? `${content.trim()}\n\n${extras.join('\n')}`
    : content.trim()

  if (fullContent.length > 2000) {
    return { status: 'error', message: '추가 정보를 포함한 제보 내용은 2000자 이내여야 합니다.' }
  }

  if (ipHash) {
    const { data: allowed, error: rateLimitError } = await createAdminClient().rpc('check_report_rate_limit', {
      p_ip_hash: ipHash,
      p_window_ms: REPORT_RATE_LIMIT_WINDOW_MS,
    })

    if (rateLimitError) {
      console.error('Report rate limit check failed:', rateLimitError.code, rateLimitError.message)
      return { status: 'error', message: rateLimitError.code === 'PGRST202'
        ? '제보 제한 기능이 아직 연결되지 않았습니다. migration 029를 적용해 주세요.'
        : '제보 요청을 확인하지 못했습니다.' }
    }
    if (!allowed) {
      return { status: 'error', message: '제보는 30초에 한 번만 등록할 수 있습니다. 잠시 후 다시 시도해 주세요.' }
    }
  }

  const payload = {
    type,
    title: title.trim(),
    content: fullContent,
    contact: contact.trim() || null,
    contact_method: contact_method.trim() || null,
    reference_url: trimmedReferenceUrl || null,
    status: 'pending',
    ip_hash: ipHash,
  } satisfies Database['public']['Tables']['reports']['Insert']

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('reports').insert(payload as never)
    if (error) {
      return { status: 'error', message: '제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
    }
  } catch {
    return { status: 'error', message: '제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }

  return { status: 'success' }
}
