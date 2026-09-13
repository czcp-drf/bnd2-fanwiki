'use client'

import { useMemo, useState, useTransition } from 'react'
import { Check, ChevronDown, ChevronLeft, ChevronRight, CornerDownRight, Link2, MessageCircle, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import Select, { type SelectOption } from '@/components/ui/Select'
import { useRouter } from 'next/navigation'
import { createBongstagramComment, deleteBongstagramComment, repairBongstagramCommentAuthors, updateBongstagramComment } from './actions'

type Post = {
  id: string
  character_id: string
  post_type: 'post' | 'story'
  posted_at: string
}

type Profile = {
  character_id: string
  profile_name: string
}

type Character = {
  id: string
  name: string
}

type Comment = {
  id: string
  post_id: string
  parent_comment_id: string | null
  author_character_id: string | null
  author_name: string
  content: string
  created_at: string
}

const COMMENT_PAGE_SIZE = 20

function displayDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function toLocalDateTime(value: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

function toIsoDateTime(value: string) {
  if (!value) return ''
  const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? new Date(`${value}:00+09:00`)
    : new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

export default function BongstagramCommentManager({
  posts,
  profiles,
  characters,
  comments,
}: {
  posts: Post[]
  profiles: Profile[]
  characters: Character[]
  comments: Comment[]
}) {
  const router = useRouter()
  const [postId, setPostId] = useState(posts[0]?.id ?? '')
  const [authorCharacterId, setAuthorCharacterId] = useState('')
  const [content, setContent] = useState('')
  const [createdAt, setCreatedAt] = useState(() => toLocalDateTime(new Date().toISOString()))
  const [search, setSearch] = useState('')
  const [postFilter, setPostFilter] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAuthorCharacterId, setEditAuthorCharacterId] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCreatedAt, setEditCreatedAt] = useState('')
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyAuthorCharacterId, setReplyAuthorCharacterId] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [replyCreatedAt, setReplyCreatedAt] = useState('')
  const [commentListOpen, setCommentListOpen] = useState(true)
  const [commentPage, setCommentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const profileByCharacterId = useMemo(() => new Map(profiles.map((profile) => [profile.character_id, profile])), [profiles])
  const profileByName = useMemo(() => new Map(profiles.map((profile) => [profile.profile_name, profile])), [profiles])
  const characterById = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters])
  const postById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts])

  const postOptions: SelectOption[] = [
    { value: 'all', label: '전체 게시물' },
    ...posts.map((post) => {
      const profile = profileByCharacterId.get(post.character_id)
      const character = characterById.get(post.character_id)
      return {
        value: post.id,
        label: `${profile?.profile_name ?? '프로필 없음'} · ${character?.name ?? '캐릭터 없음'} · ${post.post_type === 'story' ? '스토리' : '게시글'} · ${displayDate(post.posted_at)}`,
      }
    }),
  ]
  const authorOptions: SelectOption[] = profiles.map((profile) => ({
    value: profile.character_id,
    label: `${profile.profile_name} · ${characterById.get(profile.character_id)?.name ?? '캐릭터 없음'}`,
  }))
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const unresolvedComments = comments.filter((comment) => !comment.author_character_id || !profileByCharacterId.has(comment.author_character_id))
  const filteredComments = comments.filter((comment) => {
    const post = postById.get(comment.post_id)
    const profile = post ? profileByCharacterId.get(post.character_id) : null
    const target = `${comment.author_name} ${comment.content} ${profile?.profile_name ?? ''}`.toLocaleLowerCase()
    return (!normalizedSearch || target.includes(normalizedSearch))
      && (postFilter === 'all' || comment.post_id === postFilter)
  })
  const commentPageCount = Math.max(1, Math.ceil(filteredComments.length / COMMENT_PAGE_SIZE))
  const currentCommentPage = Math.min(commentPage, commentPageCount)
  const visibleComments = filteredComments.slice((currentCommentPage - 1) * COMMENT_PAGE_SIZE, currentCommentPage * COMMENT_PAGE_SIZE)

  function save() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await createBongstagramComment({ postId, authorCharacterId, content, createdAt: toIsoDateTime(createdAt) })
      if (result.error) {
        setError(result.error)
        return
      }
      setMessage('댓글이 등록되었습니다.')
      setAuthorCharacterId('')
      setContent('')
      setCreatedAt(toLocalDateTime(new Date().toISOString()))
      router.refresh()
    })
  }

  function beginEdit(comment: Comment) {
    setEditingId(comment.id)
    setEditAuthorCharacterId(comment.author_character_id ?? profileByName.get(comment.author_name)?.character_id ?? '')
    setEditContent(comment.content)
    setEditCreatedAt(toLocalDateTime(comment.created_at))
    setReplyToId(null)
    setError(null)
    setMessage(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditAuthorCharacterId('')
    setEditContent('')
    setEditCreatedAt('')
  }

  function saveEdit(commentId: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateBongstagramComment(commentId, { authorCharacterId: editAuthorCharacterId, content: editContent, createdAt: toIsoDateTime(editCreatedAt) })
      if (result.error) {
        setError(result.error)
        return
      }
      cancelEdit()
      router.refresh()
    })
  }

  function beginReply(comment: Comment) {
    setEditingId(null)
    setReplyToId(comment.id)
    setReplyAuthorCharacterId(profiles[0]?.character_id ?? '')
    setReplyContent('')
    setReplyCreatedAt(toLocalDateTime(new Date().toISOString()))
    setError(null)
    setMessage(null)
  }

  function cancelReply() {
    setReplyToId(null)
    setReplyAuthorCharacterId('')
    setReplyContent('')
    setReplyCreatedAt('')
  }

  function saveReply(comment: Comment) {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await createBongstagramComment({ postId: comment.post_id, parentCommentId: comment.id, authorCharacterId: replyAuthorCharacterId, content: replyContent, createdAt: toIsoDateTime(replyCreatedAt) })
      if (result.error) {
        setError(result.error)
        return
      }
      setMessage('답글이 등록되었습니다.')
      cancelReply()
      router.refresh()
    })
  }

  function remove(comment: Comment) {
    if (!window.confirm(`${comment.author_name} 댓글을 삭제할까요?`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteBongstagramComment(comment.id)
      if (result.error) {
        setError(result.error)
        return
      }
      if (editingId === comment.id) cancelEdit()
      router.refresh()
    })
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2">
        <MessageCircle size={16} className="text-fuchsia-400" />
        <div>
          <h2 className="text-sm font-bold text-white">댓글 관리</h2>
          <p className="mt-1 text-xs text-zinc-500">일반 사용자는 댓글을 작성할 수 없으며, 운영진이 등록된 Bongstagram 프로필을 선택해 댓글을 관리합니다.</p>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs text-amber-200/80">
            <Link2 size={14} className="mt-0.5 shrink-0 text-amber-300" />
            <p>프로필 미연결 댓글 {unresolvedComments.length}개 · 프로필명이 일치하는 댓글만 자동 연결됩니다. 나머지는 댓글 수정에서 직접 프로필을 선택해 주세요.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm('프로필명이 일치하는 기존 댓글을 Bongstagram 프로필에 연결할까요?')) return
              setError(null)
              setMessage(null)
              startTransition(async () => {
                const result = await repairBongstagramCommentAuthors()
                if (result.error) {
                  setError(result.error)
                  return
                }
                setMessage(`자동 연결 ${result.updatedCount ?? 0}개 완료 · 남은 미연결 ${result.unresolvedCount ?? 0}개`)
                router.refresh()
              })
            }}
            disabled={pending || unresolvedComments.length === 0}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-amber-300/30 px-2.5 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={12} className={pending ? 'animate-spin' : ''} />
            {pending ? '연결 중...' : '자동 연결'}
          </button>
        </div>
      )}

      {posts.length === 0 || profiles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-sm text-zinc-500">댓글을 등록하려면 게시물과 Bongstagram 프로필이 필요합니다.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
            <label className="space-y-1.5"><span className="text-xs font-medium text-zinc-500">게시물</span><Select value={postId} onChange={setPostId} options={postOptions.filter((option) => option.value !== 'all')} searchable searchPlaceholder="게시물 검색" fullWidth disabled={pending} /></label>
            <label className="space-y-1.5"><span className="text-xs font-medium text-zinc-500">작성자 프로필</span><Select value={authorCharacterId} onChange={setAuthorCharacterId} options={authorOptions} placeholder="프로필 선택" searchable searchPlaceholder="프로필 검색" fullWidth disabled={pending} /></label>
            <label className="space-y-1.5"><span className="text-xs font-medium text-zinc-500">댓글 작성 시간</span><input type="datetime-local" value={createdAt} onChange={(event) => setCreatedAt(event.target.value)} disabled={pending} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 [color-scheme:dark] focus:border-fuchsia-400/60 focus:outline-none" /></label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row"><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} rows={2} disabled={pending} placeholder="댓글 내용을 입력해 주세요." className="min-w-0 flex-1 resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none disabled:opacity-50" /><button type="button" onClick={save} disabled={pending || !postId || !authorCharacterId || !content.trim()} className="flex shrink-0 items-center justify-center gap-1.5 self-end rounded-lg bg-fuchsia-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={13} />{pending ? '등록 중...' : '댓글 등록'}</button></div>
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          {message && <p role="status" className="text-xs text-emerald-400">{message}</p>}
        </div>
      )}

      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">댓글 {filteredComments.length}개 / 전체 {comments.length}개</p>
          <button type="button" onClick={() => setCommentListOpen((value) => !value)} aria-expanded={commentListOpen} className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
            {commentListOpen ? '목록 접기' : '목록 펼치기'}
            <ChevronDown size={14} className={`transition-transform ${commentListOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {commentListOpen && <>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <input value={search} onChange={(event) => { setSearch(event.target.value); setCommentPage(1) }} placeholder="작성자·댓글·프로필 검색" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none" />
            <Select value={postFilter} onChange={(value) => { setPostFilter(value); setCommentPage(1) }} options={postOptions} searchable searchPlaceholder="게시물 검색" fullWidth />
          </div>
        {filteredComments.length === 0 ? <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-8 text-center text-sm text-zinc-600">등록된 댓글이 없습니다.</p> : <div className="space-y-2">{visibleComments.map((comment) => {
          const post = postById.get(comment.post_id)
          const profile = post ? profileByCharacterId.get(post.character_id) : null
          const character = post ? characterById.get(post.character_id) : null
          return (
            <article key={comment.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              {editingId === comment.id ? <div className="space-y-2"><Select value={editAuthorCharacterId} onChange={setEditAuthorCharacterId} options={authorOptions} placeholder="댓글 작성자 프로필" searchable searchPlaceholder="프로필 검색" fullWidth /><textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} maxLength={1000} rows={2} className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-400/60 focus:outline-none" /><input type="datetime-local" value={editCreatedAt} onChange={(event) => setEditCreatedAt(event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 [color-scheme:dark] focus:border-fuchsia-400/60 focus:outline-none" /><div className="flex gap-2"><button type="button" onClick={() => saveEdit(comment.id)} disabled={pending || !editAuthorCharacterId || !editCreatedAt} className="flex items-center gap-1 rounded-md bg-fuchsia-400 px-2.5 py-1.5 text-xs font-bold text-zinc-950 disabled:opacity-40"><Check size={12} />저장</button><button type="button" onClick={cancelEdit} disabled={pending} className="flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 disabled:opacity-40"><X size={12} />취소</button></div></div> : <><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold text-white">{comment.author_name}</p><p className="mt-1 text-[11px] text-zinc-600">{profile?.profile_name ?? '프로필 없음'} · {character?.name ?? '캐릭터 없음'} · {post?.post_type === 'story' ? '스토리' : '게시글'}</p></div><div className="flex items-center gap-2"><time className="text-[11px] text-zinc-600" dateTime={comment.created_at}>{displayDate(comment.created_at)}</time><button type="button" aria-label="댓글 수정" onClick={() => beginEdit(comment)} className="text-zinc-500 hover:text-zinc-200"><Pencil size={13} /></button><button type="button" aria-label="댓글 삭제" onClick={() => remove(comment)} disabled={pending} className="text-zinc-500 hover:text-red-400 disabled:opacity-40"><Trash2 size={13} /></button></div></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">{comment.content}</p>{!comment.parent_comment_id && <button type="button" onClick={() => beginReply(comment)} className="mt-2 flex cursor-pointer items-center gap-1 text-xs text-fuchsia-300 transition-colors hover:text-fuchsia-200"><CornerDownRight size={12} />답글</button>}{replyToId === comment.id && <div className="mt-3 space-y-2 rounded-md border border-fuchsia-400/20 bg-zinc-900 p-2.5"><Select value={replyAuthorCharacterId} onChange={setReplyAuthorCharacterId} options={authorOptions} placeholder="답글 작성자 프로필" searchable searchPlaceholder="프로필 검색" fullWidth disabled={pending} /><div className="flex flex-col gap-2 sm:flex-row"><input type="datetime-local" value={replyCreatedAt} onChange={(event) => setReplyCreatedAt(event.target.value)} disabled={pending} className="rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 [color-scheme:dark] focus:border-fuchsia-400/60 focus:outline-none" /><input value={replyContent} onChange={(event) => setReplyContent(event.target.value)} maxLength={1000} disabled={pending} placeholder="답글 내용을 입력해 주세요." className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none" /><button type="button" onClick={() => saveReply(comment)} disabled={pending || !replyAuthorCharacterId || !replyContent.trim() || !replyCreatedAt} className="flex shrink-0 items-center justify-center gap-1 rounded-md bg-fuchsia-400 px-2.5 py-1.5 text-xs font-bold text-zinc-950 disabled:opacity-40"><Plus size={12} />등록</button></div><button type="button" onClick={cancelReply} disabled={pending} className="text-xs text-zinc-500 hover:text-zinc-300">취소</button></div>}</>}
            </article>
          )
        })}</div>}
        {filteredComments.length > 0 && <div className="flex items-center justify-center gap-3 pt-2">
          <button type="button" onClick={() => setCommentPage((page) => Math.max(1, Math.min(page, commentPageCount) - 1))} disabled={currentCommentPage <= 1} aria-label="이전 댓글 페이지" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={15} /></button>
          <span className="min-w-20 text-center text-xs tabular-nums text-zinc-500">{currentCommentPage} / {commentPageCount}</span>
          <button type="button" onClick={() => setCommentPage((page) => Math.min(commentPageCount, page + 1))} disabled={currentCommentPage >= commentPageCount} aria-label="다음 댓글 페이지" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={15} /></button>
        </div>}
        </>}
      </div>
    </section>
  )
}
