'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

export async function updateReportStatus(id: string, status: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('reports').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/reports')
  return { success: true }
}

export async function blockIp(ip: string, reason?: string) {
  const supabase = await requireAdmin()
  await supabase.from('blocked_ips').upsert({ ip, reason: reason ?? null }, { onConflict: 'ip' })
  revalidatePath('/admin/reports')
  revalidatePath('/admin/blocked-ips')
}

export async function unblockIp(ip: string) {
  const supabase = await requireAdmin()
  await supabase.from('blocked_ips').delete().eq('ip', ip)
  revalidatePath('/admin/reports')
  revalidatePath('/admin/blocked-ips')
}
