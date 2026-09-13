'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Check, MessageCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import Select, { type SelectOption } from '@/components/ui/Select'
import BongstagramDisplayName from '@/app/bongstagram/BongstagramDisplayName'
import BongstagramProfileAvatar from '@/app/bongstagram/BongstagramProfileAvatar'
import { createBbsComment, deleteBbsComment, updateBbsComment } from './actions'

type Character = { id: string; name: string; avatar_url: string | null; streamers: { display_name: string; profile_image_url: string | null } | null }
type Comment = { id: string; article_id: string; author_character_id: string | null; author_name: string; content: string; created_at: string }

function toLocalDateTime(value: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

function toIsoDateTime(value: string) {
  const date = new Date(`${value}:00+09:00`)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value))
}

function CommentAuthor({ comment, character }: { comment: Comment; character?: Character }) {
  const profileName = character?.name ?? comment.author_name
  const streamer = character?.streamers
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
        {character ? <BongstagramProfileAvatar profileAvatarUrl={character.avatar_url} streamerAvatarUrl={streamer?.profile_image_url} profileName={profileName} streamerName={streamer?.display_name} fallbackText={profileName.slice(0, 1)} className="h-full w-full object-cover" /> : <span>{profileName.slice(0, 1)}</span>}
      </div>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="text-xs font-semibold text-zinc-200"><BongstagramDisplayName profileName={profileName} streamerName={streamer?.display_name} /></span><time className="text-[10px] text-zinc-600" dateTime={comment.created_at}>{displayDate(comment.created_at)}</time></div><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-400">{comment.content}</p></div>
    </div>
  )
}

export default function BbsArticleCommentPanel({ articleId, comments, characters }: { articleId: string; comments: Comment[]; characters: Character[] }) {
  const router = useRouter()
  const [authorCharacterId, setAuthorCharacterId] = useState('')
  const [content, setContent] = useState('')
  const [createdAt, setCreatedAt] = useState(() => toLocalDateTime(new Date().toISOString()))
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editAuthorCharacterId, setEditAuthorCharacterId] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCreatedAt, setEditCreatedAt] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const characterById = new Map(characters.map((character) => [character.id, character]))
  const authorOptions: SelectOption[] = characters.map((character) => ({ value: character.id, label: character.name }))

  function addComment() {
    setError('')
    startTransition(async () => {
      const result = await createBbsComment({ articleId, authorCharacterId, content, createdAt: toIsoDateTime(createdAt) })
      if (result.error) { setError(result.error); return }
      setContent('')
      setCreatedAt(toLocalDateTime(new Date().toISOString()))
      router.refresh()
    })
  }

  function beginEdit(comment: Comment) {
    setEditingCommentId(comment.id)
    setEditAuthorCharacterId(comment.author_character_id ?? '')
    setEditContent(comment.content)
    setEditCreatedAt(toLocalDateTime(comment.created_at))
    setError('')
  }

  function cancelEdit() {
    setEditingCommentId(null)
    setEditAuthorCharacterId('')
    setEditContent('')
    setEditCreatedAt('')
  }

  function saveEdit(comment: Comment) {
    setError('')
    startTransition(async () => {
      const result = await updateBbsComment(comment.id, { authorCharacterId: editAuthorCharacterId, content: editContent, createdAt: toIsoDateTime(editCreatedAt) })
      if (result.error) { setError(result.error); return }
      cancelEdit()
      router.refresh()
    })
  }

  function remove(comment: Comment) {
    if (!window.confirm(`${comment.author_name} 댓글을 삭제할까요?`)) return
    setError('')
    startTransition(async () => {
      const result = await deleteBbsComment(comment.id)
      if (result.error) { setError(result.error); return }
      if (editingCommentId === comment.id) cancelEdit()
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><MessageCircle size={14} />댓글 관리 <span className="font-normal text-zinc-600">{comments.length}개</span></div>
      <div className="mt-3 grid gap-2 md:grid-cols-[220px_minmax(0,1fr)_190px_auto] md:items-end">
        <label className="space-y-1"><span className="text-[11px] text-zinc-500">작성 캐릭터</span><Select value={authorCharacterId} onChange={setAuthorCharacterId} options={authorOptions} placeholder="캐릭터 선택" searchable searchPlaceholder="캐릭터 검색" fullWidth disabled={isPending} /></label>
        <label className="space-y-1"><span className="text-[11px] text-zinc-500">댓글 내용</span><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} rows={2} placeholder="댓글 내용을 입력해 주세요." disabled={isPending} className="block w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none disabled:opacity-50" /></label>
        <label className="space-y-1"><span className="text-[11px] text-zinc-500">작성 시간 (KST)</span><input type="datetime-local" value={createdAt} onChange={(event) => setCreatedAt(event.target.value)} disabled={isPending} className="block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 [color-scheme:dark] focus:border-amber-400/60 focus:outline-none" /></label>
        <button type="button" onClick={addComment} disabled={isPending || !authorCharacterId || !content.trim() || !createdAt} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={13} />{isPending ? '등록 중...' : '댓글 등록'}</button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
      {comments.length > 0 ? <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">{comments.map((comment) => {
        const character = comment.author_character_id ? characterById.get(comment.author_character_id) : undefined
        return <div key={comment.id} className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2.5">{editingCommentId === comment.id ? <div className="space-y-2"><Select value={editAuthorCharacterId} onChange={setEditAuthorCharacterId} options={authorOptions} placeholder="댓글 작성 캐릭터" searchable searchPlaceholder="캐릭터 검색" fullWidth disabled={isPending} /><textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} maxLength={1000} rows={2} disabled={isPending} aria-label="댓글 내용 수정" className="block w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-amber-400/60 focus:outline-none" /><div className="flex flex-wrap items-center gap-2"><input type="datetime-local" value={editCreatedAt} onChange={(event) => setEditCreatedAt(event.target.value)} disabled={isPending} aria-label="댓글 작성 시간 수정" className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-200 [color-scheme:dark]" /><button type="button" onClick={() => saveEdit(comment)} disabled={isPending || !editAuthorCharacterId || !editContent.trim() || !editCreatedAt} className="flex cursor-pointer items-center gap-1 rounded-md bg-amber-400 px-2.5 py-1.5 text-xs font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"><Check size={12} />저장</button><button type="button" onClick={cancelEdit} disabled={isPending} className="flex cursor-pointer items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"><X size={12} />취소</button></div></div> : <div className="flex items-start justify-between gap-3"><CommentAuthor comment={comment} character={character} /><div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => beginEdit(comment)} disabled={isPending} className="cursor-pointer text-zinc-600 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40" aria-label="댓글 수정"><Pencil size={13} /></button><button type="button" onClick={() => remove(comment)} disabled={isPending} className="cursor-pointer text-zinc-600 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40" aria-label="댓글 삭제"><Trash2 size={13} /></button></div></div>}</div>
      })}</div> : <p className="mt-4 border-t border-zinc-800 pt-3 text-xs text-zinc-600">등록된 댓글이 없습니다.</p>}
    </div>
  )
}
