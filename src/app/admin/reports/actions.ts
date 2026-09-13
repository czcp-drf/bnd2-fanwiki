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

function isIpHash(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value)
}

export async function blockIp(ipHash: string, reason?: string) {
  if (!isIpHash(ipHash)) return

  const supabase = await requireAdmin()
  const [blockResult, reportResult] = await Promise.all([
    supabase.from('blocked_ips').upsert({ ip_hash: ipHash.toLowerCase(), reason: reason ?? null }, { onConflict: 'ip_hash' }),
    supabase.from('reports').update({ status: 'rejected' }).eq('ip_hash', ipHash.toLowerCase()).in('status', ['pending', 'reviewing']),
  ])
  if (blockResult.error) {
    console.error('Failed to block IP hash:', blockResult.error.message)
    return
  }
  if (reportResult.error) {
    console.error('Failed to reject reports for IP hash:', reportResult.error.message)
    return
  }
  revalidatePath('/admin/reports')
  revalidatePath('/admin/blocked-ips')
}

export async function unblockIp(blockedIpId: string) {
  if (!blockedIpId) return

  const supabase = await requireAdmin()
  const { error } = await supabase.from('blocked_ips').delete().eq('id', blockedIpId)
  if (error) {
    console.error('Failed to unblock IP hash:', error.message)
    return
  }
  revalidatePath('/admin/reports')
  revalidatePath('/admin/blocked-ips')
}
