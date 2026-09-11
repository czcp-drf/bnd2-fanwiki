'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(_: unknown, formData: FormData) {
  const password = formData.get('password') as string

  if (password !== process.env.ADMIN_PASSWORD) {
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
