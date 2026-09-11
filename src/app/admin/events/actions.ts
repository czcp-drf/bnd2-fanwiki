'use server'

import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'

export async function createEvent(data: {
  title: string
  summary: string | null
  content: string | null
  type: string
  occurred_at: string | null
  thumbnail_url: string | null
  is_published: boolean
}) {
  const supabase = await requireAdmin()
  const { data: event, error } = await supabase
    .from('events')
    .insert(data)
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/events')
  revalidatePath('/events')
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
}) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('events').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}/edit`)
  revalidatePath('/events')
  revalidatePath(`/events/${id}`)
  return { success: true }
}

export async function deleteEvent(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { success: true }
}

export async function togglePublish(id: string, current: boolean) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('events').update({ is_published: !current }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath(`/events/${id}`)
}

export async function addParticipant(eventId: string, characterId: string, role: string | null) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_participants').insert({
    event_id: eventId,
    character_id: characterId,
    role: role || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/events/${eventId}/edit`)
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function updateParticipant(eventId: string, participantId: string, role: string | null) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_participants').update({ role }).eq('id', participantId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/events/${eventId}/edit`)
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function removeParticipant(eventId: string, participantId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_participants').delete().eq('id', participantId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/events/${eventId}/edit`)
  revalidatePath(`/events/${eventId}`)
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
  revalidatePath(`/admin/events/${eventId}/edit`)
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function updateClip(eventId: string, clipId: string, data: { clip_url: string; label: string | null }) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_clips').update(data).eq('id', clipId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/events/${eventId}/edit`)
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

export async function removeClip(eventId: string, clipId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('event_clips').delete().eq('id', clipId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/events/${eventId}/edit`)
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
