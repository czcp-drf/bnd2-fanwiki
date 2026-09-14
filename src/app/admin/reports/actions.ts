'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

const REPORT_STATUSES = ['pending', 'reviewing', 'applied', 'rejected'] as const

function isReportStatus(value: string): value is (typeof REPORT_STATUSES)[number] {
  return (REPORT_STATUSES as readonly string[]).includes(value)
}

export async function updateReportStatus(id: string, status: string) {
  if (!id || !isReportStatus(status)) return { error: '올바르지 않은 제보 상태입니다.' }

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
  if (!isIpHash(ipHash)) return { error: '올바르지 않은 IP 해시입니다.' }

  const supabase = await requireAdmin()
  const [blockResult, reportResult] = await Promise.all([
    supabase.from('blocked_ips').upsert({ ip_hash: ipHash.toLowerCase(), reason: reason ?? null }, { onConflict: 'ip_hash' }),
    supabase.from('reports').update({ status: 'rejected' }).eq('ip_hash', ipHash.toLowerCase()).in('status', ['pending', 'reviewing']),
  ])
  if (blockResult.error) {
    console.error('Failed to block IP hash:', blockResult.error.message)
    return { error: 'IP 해시 차단에 실패했습니다.' }
  }
  if (reportResult.error) {
    console.error('Failed to reject reports for IP hash:', reportResult.error.message)
    return { error: '해당 IP의 제보를 반려 처리하지 못했습니다.' }
  }
  revalidatePath('/admin/reports')
  revalidatePath('/admin/blocked-ips')
  return { success: true }
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
