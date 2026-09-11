import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export async function requireAdmin() {
  const token = (await cookies()).get('admin_token')?.value

  if (!token || token !== process.env.ADMIN_TOKEN) {
    redirect('/admin/login')
  }

  return createAdminClient()
}
