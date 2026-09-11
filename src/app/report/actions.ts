'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

async function getIp(): Promise<string | null> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0].trim() ?? h.get('x-real-ip') ?? null
}

async function isBlocked(ip: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('blocked_ips')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
  return (count ?? 0) > 0
}

export type ReportFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

const ALLOWED_TYPES = ['new_character', 'new_event', 'correction', 'other'] as const

function isReportType(value: string): value is (typeof ALLOWED_TYPES)[number] {
  return (ALLOWED_TYPES as readonly string[]).includes(value)
}

function getString(formData: FormData, key: string): string {
  const val = formData.get(key)
  return typeof val === 'string' ? val : ''
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
  const ip = await getIp()
  if (ip && await isBlocked(ip)) {
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

  if (reference_url.length > 500) {
    return { status: 'error', message: '참고 링크는 500자 이내로 입력해주세요.' }
  }

  const hasCoords = map_x && map_y && !isNaN(Number(map_x)) && !isNaN(Number(map_y))
  const fullContent = hasCoords
    ? `${content.trim()}\n\n[지도 좌표] X: ${Number(map_x).toFixed(1)}, Y: ${Number(map_y).toFixed(1)}`
    : content.trim()

  const payload = {
    type,
    title: title.trim(),
    content: fullContent,
    contact: contact.trim() || null,
    contact_method: contact_method.trim() || null,
    reference_url: reference_url.trim() || null,
    status: 'pending',
    ip: ip ?? null,
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
