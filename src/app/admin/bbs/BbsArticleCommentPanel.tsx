'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { MessageCircle, Plus } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import Select, { type SelectOption } from '@/components/ui/Select'
import { createBbsComment } from './actions'

type Character = { id: string; name: string; avatar_url: string | null }
type Comment = { id: string; article_id: string; author_character_id: string | null; author_name: string; content: string; created_at: string }

function displayDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

export default function BbsArticleCommentPanel({ articleId, comments, characters }: { articleId: string; comments: Comment[]; characters: Character[] }) {
  const router = useRouter()
  const [authorCharacterId, setAuthorCharacterId] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const characterById = new Map(characters.map((character) => [character.id, character]))
  const authorOptions: SelectOption[] = characters.map((character) => ({ value: character.id, label: character.name }))

  function addComment() {
    setError('')
    startTransition(async () => {
      const result = await createBbsComment({ articleId, authorCharacterId, content })
      if (result.error) {
        setError(result.error)
        return
      }
      setContent('')
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><MessageCircle size={14} />댓글 관리 <span className="font-normal text-zinc-600">{comments.length}개</span></div>
      <div className="mt-3 grid gap-2 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-end">
        <label className="space-y-1"><span className="text-[11px] text-zinc-500">작성 캐릭터</span><Select value={authorCharacterId} onChange={setAuthorCharacterId} options={authorOptions} placeholder="캐릭터 선택" searchable searchPlaceholder="캐릭터 검색" fullWidth disabled={isPending} /></label>
        <label className="space-y-1"><span className="text-[11px] text-zinc-500">댓글 내용</span><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} rows={2} placeholder="댓글 내용을 입력해 주세요." disabled={isPending} className="block w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none disabled:opacity-50" /></label>
        <button type="button" onClick={addComment} disabled={isPending || !authorCharacterId || !content.trim()} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={13} />{isPending ? '등록 중...' : '댓글 등록'}</button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
      {comments.length > 0 ? <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">{comments.map((comment) => {
        const character = comment.author_character_id ? characterById.get(comment.author_character_id) : undefined
        return <div key={comment.id} className="flex gap-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">{character?.avatar_url ? <AppImage src={character.avatar_url} alt="" width={32} height={32} className="h-full w-full object-cover" /> : (character?.name ?? comment.author_name).slice(0, 1)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="text-xs font-semibold text-zinc-200">{character?.name ?? comment.author_name}</span><time className="text-[10px] text-zinc-600" dateTime={comment.created_at}>{displayDate(comment.created_at)}</time></div><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-400">{comment.content}</p></div></div>
      })}</div> : <p className="mt-4 border-t border-zinc-800 pt-3 text-xs text-zinc-600">등록된 댓글이 없습니다.</p>}
    </div>
  )
}
