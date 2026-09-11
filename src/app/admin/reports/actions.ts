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
