'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClientIpHash } from '@/lib/bongstagram/like-ip'

export async function login(_: unknown, formData: FormData) {
  const password = formData.get('password')
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_TOKEN) {
    return { error: '로그인 설정을 확인할 수 없습니다.' }
  }

  try {
    const ipHash = await getClientIpHash()
    if (!ipHash) return { error: '접속 환경을 확인할 수 없어 로그인할 수 없습니다.' }
    const { data: retryAfter, error } = await createAdminClient().rpc('check_admin_login_rate_limit', { p_ip_hash: ipHash })
    if (error || typeof retryAfter !== 'number' || !Number.isInteger(retryAfter) || retryAfter < 0) {
      return { error: '로그인 요청을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.' }
    }
    if (retryAfter > 0) {
      return { error: `로그인 시도 횟수를 초과했습니다. 약 ${Math.ceil(retryAfter / 60)}분 후 다시 시도해주세요.` }
    }
  } catch {
    return { error: '로그인 요청을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.' }
  }

  if (typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD) {
    return { error: '비밀번호가 올바르지 않습니다.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('admin_token', process.env.ADMIN_TOKEN!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  redirect('/admin')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  redirect('/admin/login')
}
