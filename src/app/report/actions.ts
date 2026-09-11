'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

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
  const type = getString(formData, 'type')
  const title = getString(formData, 'title')
  const content = getString(formData, 'content')
  const contact = getString(formData, 'contact')
  const contact_method = getString(formData, 'contact_method')
  const reference_url = getString(formData, 'reference_url')

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

  const payload = {
    type,
    title: title.trim(),
    content: content.trim(),
    contact: contact.trim() || null,
    contact_method: contact_method.trim() || null,
    reference_url: reference_url.trim() || null,
    status: 'pending',
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
