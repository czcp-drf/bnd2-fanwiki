'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'
import { invalidateWikiCache } from '@/lib/cache/wiki'

function invalidateAndRevalidate(path: string, type?: 'page' | 'layout') {
  invalidateWikiCache()
  if (type) revalidatePath(path, type)
  else revalidatePath(path)
}

export async function createEvent(data: {
  title: string
  summary: string | null
  content: string | null
  type: string
  occurred_at: string | null
  thumbnail_url: string | null
  is_published: boolean
  location_x: number | null
  location_y: number | null
}) {
  const supabase = await requireAdmin()
  const { data: event, error } = await supabase
    .from('events')
    .insert(data)
    .select('id')
    .single()
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/events')
  invalidateAndRevalidate('/events')
  return { id: event.id }
}

export async function updateEvent(id: string, data: {
  title: string
  summary: string | null
  content: string | null
  type: string
  occurred_at: string | null
  thumbnail_url: string | null
  is_published: boolean
  location_x: number | null
  location_y: number | null
}) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('events').update(data).eq('id', id)
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/events')
  invalidateAndRevalidate(`/admin/events/${id}/edit`)
  invalidateAndRevalidate('/events')
  invalidateAndRevalidate(`/events/${id}`)
  return { success: true }
}

export async function deleteEvent(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/events')
  invalidateAndRevalidate('/events')
  return { success: true }
}

export async function togglePublish(id: string, current: boolean) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('events').update({ is_published: !current }).eq('id', id)
  if (error) return { error: error.message }
  invalidateAndRevalidate('/admin/events')
  invalidateAndRevalidate('/events')
  invalidateAndRevalidate(`/events/${id}`)
}

export async function addParticipant(eventId: string, characterId: string, role: string | null) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_participants').insert({
    event_id: eventId,
    character_id: characterId,
    role: role || null,
  })
  if (error) return { error: error.message }
  invalidateAndRevalidate(`/admin/events/${eventId}/edit`)
  invalidateAndRevalidate(`/events/${eventId}`)
  return { success: true }
}

export async function updateParticipant(eventId: string, participantId: string, role: string | null) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_participants').update({ role }).eq('id', participantId)
  if (error) return { error: error.message }
  invalidateAndRevalidate(`/admin/events/${eventId}/edit`)
  invalidateAndRevalidate(`/events/${eventId}`)
  return { success: true }
}

export async function removeParticipant(eventId: string, participantId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_participants').delete().eq('id', participantId)
  if (error) return { error: error.message }
  invalidateAndRevalidate(`/admin/events/${eventId}/edit`)
  invalidateAndRevalidate(`/events/${eventId}`)
  return { success: true }
}

export async function addClip(eventId: string, data: {
  streamer_id: string | null
  clip_url: string
  label: string | null
  sort_order: number
}) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_clips').insert({ event_id: eventId, ...data })
  if (error) return { error: error.message }
  invalidateAndRevalidate(`/admin/events/${eventId}/edit`)
  invalidateAndRevalidate(`/events/${eventId}`)
  return { success: true }
}

export async function updateClip(eventId: string, clipId: string, data: { clip_url: string; label: string | null }) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_clips').update(data).eq('id', clipId)
  if (error) return { error: error.message }
  invalidateAndRevalidate(`/admin/events/${eventId}/edit`)
  invalidateAndRevalidate(`/events/${eventId}`)
  return { success: true }
}

export async function removeClip(eventId: string, clipId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_clips').delete().eq('id', clipId)
  if (error) return { error: error.message }
  invalidateAndRevalidate(`/admin/events/${eventId}/edit`)
  invalidateAndRevalidate(`/events/${eventId}`)
  return { success: true }
}

export async function reorderClips(eventId: string, orders: { id: string; sortOrder: number }[]) {
  const supabase = await requireAdmin()
  const results = await Promise.all(
    orders.map(({ id, sortOrder }) =>
      supabase.from('event_clips').update({ sort_order: sortOrder }).eq('id', id)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  invalidateAndRevalidate(`/admin/events/${eventId}/edit`)
  invalidateAndRevalidate(`/events/${eventId}`)
  return { success: true }
}

export async function reorderParticipants(eventId: string, orders: { id: string; sortOrder: number }[]) {
  const supabase = await requireAdmin()
  const results = await Promise.all(
    orders.map(({ id, sortOrder }) =>
      supabase.from('event_participants').update({ sort_order: sortOrder }).eq('id', id)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  invalidateAndRevalidate(`/admin/events/${eventId}/edit`)
  invalidateAndRevalidate(`/events/${eventId}`)
  return { success: true }
}
