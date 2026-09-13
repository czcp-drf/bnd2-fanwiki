'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Check, ChevronDown, CornerDownRight, LoaderCircle, MessageCircle, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import Select, { type SelectOption } from '@/components/ui/Select'
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client'
import { createBongstagramComment, createBongstagramPost, createBongstagramUploadUrl, deleteBongstagramComment, deleteBongstagramPost, deleteBongstagramUploadedMedia, updateBongstagramPost } from './actions'

type Character = {
  id: string
  name: string
  avatar_url: string | null
  streamers: { display_name: string } | null
}

type Profile = {
  character_id: string
  profile_name: string
  avatar_url: string | null
}

type Organization = {
  id: string
  name: string
}

type Membership = {
  character_id: string
  organization_id: string
}

type PostMedia = {
  id: string
  media_type: 'image' | 'video'
  media_url: string
  storage_path: string | null
  sort_order: number
}

type MediaDraft = {
  mediaType: 'image' | 'video'
  mediaUrl: string
  storagePath?: string | null
}

type Post = {
  id: string
  character_id: string
  post_type: 'post' | 'story'
  content: string
  posted_at: string
  story_expires_at: string | null
  media: PostMedia[]
}

type Comment = {
  id: string
  post_id: string
  parent_comment_id: string | null
  author_name: string
  content: string
  created_at: string
}

const postTypeOptions: SelectOption[] = [
  { value: 'post', label: '게시글' },
  { value: 'story', label: '스토리' },
]

const mediaTypeOptions: SelectOption[] = [
  { value: 'image', label: '이미지' },
  { value: 'video', label: '동영상' },
]

const postFilterOptions: SelectOption[] = [
  { value: 'all', label: '전체 게시물' },
  { value: 'post', label: '게시글' },
  { value: 'story', label: '스토리' },
]

const mediaFilterOptions: SelectOption[] = [
  { value: 'all', label: '전체 미디어' },
  { value: 'image', label: '이미지 포함' },
  { value: 'video', label: '동영상 포함' },
]

const sortOptions: SelectOption[] = [
  { value: 'latest', label: '최신 게시일 순' },
  { value: 'oldest', label: '오래된 게시일 순' },
]

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

function displayDate(value: string) {
  return value.replace('T', ' ').slice(0, 16)
}

async function uploadSelectedFiles(
  files: File[],
  existingMedia: MediaDraft[],
  onChange: (media: MediaDraft[]) => void,
  setError: (error: string | null) => void,
  setUploading: (uploading: boolean) => void,
) {
  const available = 10 - existingMedia.filter((item) => item.mediaUrl.trim()).length
  if (files.length > available) {
    setError(`미디어는 게시물당 10개까지 등록할 수 있습니다. ${available}개만 더 추가할 수 있습니다.`)
    return
  }

  setError(null)
  setUploading(true)
  const supabase = createSupabaseBrowserClient()
  const uploaded: MediaDraft[] = []

  try {
    for (const file of files) {
      const result = await createBongstagramUploadUrl({ fileName: file.name, contentType: file.type, size: file.size })
      if (result.error || !result.path || !result.token || !result.publicUrl) {
        throw new Error(result.error ?? '업로드 주소를 만들지 못했습니다.')
      }

      const { error } = await supabase.storage
        .from('bongstagram-media')
        .uploadToSignedUrl(result.path, result.token, file, { contentType: file.type })
      if (error) throw new Error(`파일 업로드에 실패했습니다: ${file.name}`)

      uploaded.push({
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        mediaUrl: result.publicUrl,
        storagePath: result.path,
      })
    }
    onChange([...existingMedia, ...uploaded])
  } catch (error) {
    const uploadedPaths = uploaded.map((item) => item.storagePath).filter((path): path is string => Boolean(path))
    if (uploadedPaths.length) void deleteBongstagramUploadedMedia(uploadedPaths)
    setError(error instanceof Error ? error.message : '파일 업로드에 실패했습니다.')
  } finally {
    setUploading(false)
  }
}

function MediaFields({ media, disabled, uploading, onChange, onUpload }: { media: MediaDraft[]; disabled: boolean; uploading: boolean; onChange: (media: MediaDraft[]) => void; onUpload: (files: File[]) => void }) {
  function updateMedia(index: number, changes: Partial<MediaDraft>) {
    onChange(media.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item))
  }

  function moveMedia(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= media.length) return
    const next = [...media]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">미디어 <span className="text-zinc-600">(최대 10개)</span></span>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1 rounded-md border border-fuchsia-400/30 px-2 py-1 text-[11px] text-fuchsia-300 transition-colors hover:border-fuchsia-400/60 hover:bg-fuchsia-400/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40">
            {uploading ? <LoaderCircle size={11} className="animate-spin" /> : <Upload size={11} />}
            {uploading ? '업로드 중...' : '파일 업로드'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime" multiple disabled={disabled || uploading || media.length >= 10} onChange={(event) => { if (event.target.files) onUpload(Array.from(event.target.files)); event.currentTarget.value = '' }} className="sr-only" />
          </label>
          <button type="button" onClick={() => onChange([...media, { mediaType: 'image', mediaUrl: '' }])} disabled={disabled || uploading || media.length >= 10} className="flex cursor-pointer items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40">
            <Plus size={11} /> URL 추가
          </button>
        </div>
      </div>
      <p className="text-[11px] text-zinc-600">이미지 10MB 이하, 동영상 100MB 이하 · 직접 업로드 또는 외부 URL을 사용할 수 있습니다.</p>
      {media.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-3 text-xs text-zinc-600">등록할 이미지나 동영상을 추가해 주세요.</p>
      ) : (
        media.map((item, index) => (
          <div key={`${index}-${item.mediaType}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
            <span className="w-5 text-center text-[11px] text-zinc-600">{index + 1}</span>
            <div className="w-24 shrink-0"><Select value={item.mediaType} onChange={(value) => updateMedia(index, { mediaType: value as MediaDraft['mediaType'] })} options={mediaTypeOptions} fullWidth disabled={disabled} /></div>
            <input value={item.mediaUrl} disabled={disabled || uploading} onChange={(event) => updateMedia(index, { mediaUrl: event.target.value, storagePath: null })} placeholder={`${item.mediaType === 'video' ? '동영상' : '이미지'} URL (https://...)`} className="min-w-48 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none disabled:opacity-50" />
            {item.storagePath && <span className="rounded bg-emerald-400/10 px-1.5 py-1 text-[10px] text-emerald-300">Storage</span>}
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => moveMedia(index, -1)} disabled={disabled || uploading || index === 0} aria-label="미디어 위로 이동" className="cursor-pointer rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp size={13} /></button>
              <button type="button" onClick={() => moveMedia(index, 1)} disabled={disabled || uploading || index === media.length - 1} aria-label="미디어 아래로 이동" className="cursor-pointer rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown size={13} /></button>
              <button type="button" onClick={() => onChange(media.filter((_, itemIndex) => itemIndex !== index))} disabled={disabled || uploading} aria-label="미디어 삭제" className="cursor-pointer rounded p-1 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"><X size={13} /></button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function PostFields({ postType, media, content, postedAt, disabled, uploading, onPostTypeChange, onMediaChange, onUpload, onContentChange, onPostedAtChange }: { postType: 'post' | 'story'; media: MediaDraft[]; content: string; postedAt: string; disabled: boolean; uploading: boolean; onPostTypeChange: (value: 'post' | 'story') => void; onMediaChange: (media: MediaDraft[]) => void; onUpload: (files: File[]) => void; onContentChange: (value: string) => void; onPostedAtChange: (value: string) => void }) {
  const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none disabled:opacity-50'
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[180px_180px_minmax(0,1fr)]">
        <label className="space-y-1.5"><span className="text-xs font-medium text-zinc-500">게시물 타입</span><Select value={postType} onChange={(value) => onPostTypeChange(value as 'post' | 'story')} options={postTypeOptions} fullWidth disabled={disabled} /></label>
        <label className="space-y-1.5"><span className="text-xs font-medium text-zinc-500">게시일</span><input type="datetime-local" value={postedAt} disabled={disabled} onChange={(event) => onPostedAtChange(event.target.value)} className={`${inputClass} [color-scheme:dark]`} /></label>
        <p className="self-end pb-2 text-xs text-zinc-600">{postType === 'story' ? '스토리는 다음 서버 종료(오전 3시)까지 표시되며 프로필에 보관됩니다.' : '게시글은 공개 피드에 표시됩니다.'}</p>
      </div>
      <MediaFields media={media} disabled={disabled} uploading={uploading} onChange={onMediaChange} onUpload={onUpload} />
      <label className="block space-y-1.5"><span className="text-xs font-medium text-zinc-500">본문</span><textarea value={content} maxLength={2200} disabled={disabled} onChange={(event) => onContentChange(event.target.value)} placeholder="게시물 본문 (미디어만 등록할 수도 있습니다)" rows={3} className={`${inputClass} resize-y`} /><span className="block text-right text-[11px] text-zinc-600">{content.length}/2200</span></label>
    </div>
  )
}

function NewPostForm({ characters, profiles }: { characters: Character[]; profiles: Profile[] }) {
  const router = useRouter()
  const [characterId, setCharacterId] = useState('')
  const [postType, setPostType] = useState<'post' | 'story'>('post')
  const [media, setMedia] = useState<MediaDraft[]>([])
  const [content, setContent] = useState('')
  const [postedAt, setPostedAt] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const characterById = new Map(characters.map((character) => [character.id, character]))
  const options = profiles.map((profile) => {
    const character = characterById.get(profile.character_id)
    return character ? { value: character.id, label: `${profile.profile_name} · ${character.name}` } : null
  }).filter((option): option is { value: string; label: string } => option !== null)

  function upload(files: File[]) {
    void uploadSelectedFiles(files, media, setMedia, setError, setUploading)
  }

  function save() {
    setMessage(null); setError(null)
    startTransition(async () => {
      const result = await createBongstagramPost({ characterId, postType, media, content, postedAt: toIsoDateTime(postedAt) })
      if (result.error) { setError(result.error); return }
      setMessage('게시물이 등록되었습니다.'); setCharacterId(''); setPostType('post'); setMedia([]); setContent(''); setPostedAt(''); router.refresh()
    })
  }

  return (
    <section className="rounded-xl border border-fuchsia-400/20 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2"><Plus size={16} className="text-fuchsia-400" /><h2 className="text-sm font-bold text-white">게시물 등록</h2></div>
      {options.length === 0 ? <p className="text-sm text-zinc-500">게시물을 작성할 Bongstagram 프로필이 없습니다. 먼저 프로필을 연결해 주세요.</p> : (
        <div className="space-y-4">
          <div className="max-w-md"><label className="mb-1.5 block text-xs font-medium text-zinc-500">작성자</label><Select value={characterId} onChange={setCharacterId} options={options} placeholder="프로필 선택" searchPlaceholder="프로필·캐릭터명 검색" searchable fullWidth disabled={pending} /></div>
          <PostFields postType={postType} media={media} content={content} postedAt={postedAt} disabled={pending} uploading={uploading} onPostTypeChange={setPostType} onMediaChange={setMedia} onUpload={upload} onContentChange={setContent} onPostedAtChange={setPostedAt} />
          <div className="flex items-center gap-3"><button type="button" onClick={save} disabled={pending || uploading || !characterId || (!media.some((item) => item.mediaUrl.trim()) && !content.trim())} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-fuchsia-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-40"><Check size={13} />{pending ? '저장 중...' : '등록'}</button>{error && <p role="alert" className="text-xs text-red-400">{error}</p>}{message && <p role="status" className="text-xs text-emerald-400">{message}</p>}</div>
        </div>
      )}
    </section>
  )
}

function MediaPreview({ media }: { media: PostMedia }) {
  return media.media_type === 'video'
    ? <video controls preload="metadata" src={media.media_url} className="aspect-square w-32 rounded-lg bg-zinc-950 object-cover" />
    : <AppImage src={media.media_url} alt="게시물 미디어" width={128} height={128} className="aspect-square w-32 rounded-lg object-cover" />
}

function PostEditRow({ post, character, profile, comments }: { post: Post; character: Character; profile: Profile; comments: Comment[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [postType, setPostType] = useState<'post' | 'story'>(post.post_type)
  const [media, setMedia] = useState<MediaDraft[]>(post.media.map((item) => ({ mediaType: item.media_type, mediaUrl: item.media_url, storagePath: item.storage_path })))
  const [content, setContent] = useState(post.content)
  const [postedAt, setPostedAt] = useState(toLocalDateTime(post.posted_at))
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentAuthor, setCommentAuthor] = useState(profile.profile_name)
  const [commentContent, setCommentContent] = useState('')
  const [commentCreatedAt, setCommentCreatedAt] = useState(() => toLocalDateTime(new Date().toISOString()))
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyAuthor, setReplyAuthor] = useState(profile.profile_name)
  const [replyContent, setReplyContent] = useState('')
  const [replyCreatedAt, setReplyCreatedAt] = useState('')
  const [pending, startTransition] = useTransition()
  const postComments = comments.filter((comment) => comment.post_id === post.id)

  function upload(files: File[]) {
    void uploadSelectedFiles(files, media, setMedia, setError, setUploading)
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateBongstagramPost(post.id, { characterId: post.character_id, postType, media, content, postedAt: toIsoDateTime(postedAt) })
      if (result.error) { setError(result.error); return }
      setEditing(false); router.refresh()
    })
  }

  function remove() {
    if (!window.confirm(`${profile.profile_name}의 게시물을 삭제할까요?`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteBongstagramPost(post.id)
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  function cancel() {
    setPostType(post.post_type); setMedia(post.media.map((item) => ({ mediaType: item.media_type, mediaUrl: item.media_url, storagePath: item.storage_path }))); setContent(post.content); setPostedAt(toLocalDateTime(post.posted_at)); setError(null); setEditing(false)
  }

  function addComment() {
    setError(null)
    startTransition(async () => {
      const result = await createBongstagramComment({ postId: post.id, authorName: commentAuthor, content: commentContent, createdAt: toIsoDateTime(commentCreatedAt) })
      if (result.error) {
        setError(result.error)
        return
      }
      setCommentContent('')
      setCommentCreatedAt(toLocalDateTime(new Date().toISOString()))
      router.refresh()
    })
  }

  function beginReply(comment: Comment) {
    setReplyToId(comment.id)
    setReplyAuthor(profile.profile_name)
    setReplyContent('')
    setReplyCreatedAt(toLocalDateTime(new Date().toISOString()))
    setError(null)
  }

  function cancelReply() {
    setReplyToId(null)
    setReplyContent('')
    setReplyCreatedAt('')
  }

  function addReply(comment: Comment) {
    setError(null)
    startTransition(async () => {
      const result = await createBongstagramComment({ postId: post.id, parentCommentId: comment.id, authorName: replyAuthor, content: replyContent, createdAt: toIsoDateTime(replyCreatedAt) })
      if (result.error) {
        setError(result.error)
        return
      }
      cancelReply()
      router.refresh()
    })
  }

  function removeComment(comment: Comment) {
    if (!window.confirm(`${comment.author_name} 댓글을 삭제할까요?`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteBongstagramComment(comment.id)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">{profile.avatar_url ? <AppImage src={profile.avatar_url} alt={profile.profile_name} className="h-full w-full object-cover" /> : character.name.slice(0, 1)}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{profile.profile_name}</p><p className="truncate text-xs text-zinc-500">{character.name} · {post.post_type === 'story' ? '스토리' : '게시글'} · {displayDate(post.posted_at)}</p></div></div>
        {!editing && <div className="flex items-center gap-2"><button type="button" onClick={() => { setError(null); setEditing(true) }} className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"><Pencil size={12} />수정</button><button type="button" onClick={remove} disabled={pending} className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-40"><Trash2 size={12} />삭제</button></div>}
      </div>
      {editing ? <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4"><PostFields postType={postType} media={media} content={content} postedAt={postedAt} disabled={pending} uploading={uploading} onPostTypeChange={setPostType} onMediaChange={setMedia} onUpload={upload} onContentChange={setContent} onPostedAtChange={setPostedAt} /><div className="flex items-center gap-2"><button type="button" onClick={save} disabled={pending || uploading || (!media.some((item) => item.mediaUrl.trim()) && !content.trim())} className="flex cursor-pointer items-center gap-1 rounded-lg bg-fuchsia-400 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-40"><Check size={12} />{pending ? '저장 중...' : '저장'}</button><button type="button" onClick={cancel} disabled={pending || uploading} className="flex cursor-pointer items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-40"><X size={12} />취소</button></div>{error && <p role="alert" className="text-xs text-red-400">{error}</p>}</div> : <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">{post.media.length > 0 && <div className="flex flex-wrap gap-2">{post.media.map((mediaItem) => <MediaPreview key={mediaItem.id} media={mediaItem} />)}</div>}{post.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">{post.content}</p> : <p className="text-sm text-zinc-600">본문 없음</p>}</div>}
      {!editing && (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <button type="button" onClick={() => setCommentsOpen((value) => !value)} className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200">
            <MessageCircle size={13} /> 댓글 {postComments.length}개
            <ChevronDown size={13} className={`transition-transform ${commentsOpen ? 'rotate-180' : ''}`} />
          </button>
          {commentsOpen && (
            <div className="mt-3 space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
              {postComments.length > 0 && <div className="space-y-2">{postComments.map((comment) => (
                <div key={comment.id} className={`rounded-md border border-zinc-800/70 px-2.5 py-2 ${comment.parent_comment_id ? 'ml-6' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-xs font-semibold text-zinc-200">{comment.author_name}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-400">{comment.content}</p><p className="mt-1 text-[10px] text-zinc-600">{displayDate(comment.created_at)}</p></div>
                    <div className="flex shrink-0 items-center gap-2"><button type="button" aria-label="답글 등록" onClick={() => beginReply(comment)} disabled={pending || Boolean(comment.parent_comment_id)} className="text-zinc-600 transition-colors hover:text-fuchsia-300 disabled:opacity-30"><CornerDownRight size={13} /></button><button type="button" aria-label="댓글 삭제" onClick={() => removeComment(comment)} disabled={pending} className="text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-40"><Trash2 size={13} /></button></div>
                  </div>
                  {replyToId === comment.id && <div className="mt-3 space-y-2 border-t border-zinc-800 pt-2"><div className="flex flex-col gap-2 sm:flex-row"><input value={replyAuthor} onChange={(event) => setReplyAuthor(event.target.value)} maxLength={40} disabled={pending} aria-label="답글 작성자" className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 sm:w-36" placeholder="작성자명" /><input type="datetime-local" value={replyCreatedAt} onChange={(event) => setReplyCreatedAt(event.target.value)} disabled={pending} aria-label="답글 작성 시간" className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 [color-scheme:dark]" /><input value={replyContent} onChange={(event) => setReplyContent(event.target.value)} maxLength={1000} disabled={pending} aria-label="답글 내용" className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600" placeholder="답글 내용을 입력해 주세요." /><button type="button" onClick={() => addReply(comment)} disabled={pending || !replyAuthor.trim() || !replyContent.trim() || !replyCreatedAt} className="flex shrink-0 items-center justify-center gap-1 rounded-md bg-fuchsia-400 px-2.5 py-1.5 text-xs font-bold text-zinc-950 disabled:opacity-40"><Plus size={12} />등록</button></div><button type="button" onClick={cancelReply} disabled={pending} className="text-xs text-zinc-500 hover:text-zinc-300">취소</button></div>}
                </div>
              ))}</div>}
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={commentAuthor} onChange={(event) => setCommentAuthor(event.target.value)} maxLength={40} disabled={pending} aria-label="댓글 작성자" className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none sm:w-36" placeholder="작성자명" />
                <input type="datetime-local" value={commentCreatedAt} onChange={(event) => setCommentCreatedAt(event.target.value)} disabled={pending} aria-label="댓글 작성 시간" className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 [color-scheme:dark] focus:border-fuchsia-400/60 focus:outline-none" />
                <input value={commentContent} onChange={(event) => setCommentContent(event.target.value)} maxLength={1000} disabled={pending} aria-label="댓글 내용" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (commentContent.trim()) addComment() } }} className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none" placeholder="댓글 내용을 입력해 주세요." />
                <button type="button" onClick={addComment} disabled={pending || !commentAuthor.trim() || !commentContent.trim()} className="flex shrink-0 items-center justify-center gap-1 rounded-md bg-fuchsia-400 px-2.5 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={12} />등록</button>
              </div>
              {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
            </div>
          )}
        </div>
      )}
      {!editing && error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
    </article>
  )
}

export default function BongstagramPostManager({ characters, profiles, organizations, memberships, posts, comments }: { characters: Character[]; profiles: Profile[]; organizations: Organization[]; memberships: Membership[]; posts: Post[]; comments: Comment[] }) {
  const characterById = new Map(characters.map((character) => [character.id, character]))
  const profileByCharacterId = new Map(profiles.map((profile) => [profile.character_id, profile]))
  const [search, setSearch] = useState('')
  const [characterFilter, setCharacterFilter] = useState('all')
  const [organizationFilter, setOrganizationFilter] = useState('all')
  const [postFilter, setPostFilter] = useState('all')
  const [mediaFilter, setMediaFilter] = useState('all')
  const [sort, setSort] = useState('latest')
  const organizationsByCharacterId = new Map<string, string[]>()
  memberships.forEach((membership) => {
    const current = organizationsByCharacterId.get(membership.character_id) ?? []
    current.push(membership.organization_id)
    organizationsByCharacterId.set(membership.character_id, current)
  })
  const characterFilterOptions: SelectOption[] = [
    { value: 'all', label: '전체 캐릭터' },
    ...characters
      .filter((character) => profileByCharacterId.has(character.id))
      .map((character) => ({ value: character.id, label: `${character.name} · ${profileByCharacterId.get(character.id)?.profile_name ?? ''}` })),
  ]
  const organizationFilterOptions: SelectOption[] = [
    { value: 'all', label: '전체 조직' },
    { value: '__none__', label: '무소속' },
    ...organizations.map((organization) => ({ value: organization.id, label: organization.name })),
  ]
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filteredPosts = posts
    .filter((post) => {
      const character = characterById.get(post.character_id)
      const profile = profileByCharacterId.get(post.character_id)
      const organizationIds = organizationsByCharacterId.get(post.character_id) ?? []
      const searchTarget = `${character?.name ?? ''} ${profile?.profile_name ?? ''} ${post.content}`.toLocaleLowerCase()
      return (!normalizedSearch || searchTarget.includes(normalizedSearch))
        && (characterFilter === 'all' || post.character_id === characterFilter)
        && (organizationFilter === 'all' || (organizationFilter === '__none__' ? organizationIds.length === 0 : organizationIds.includes(organizationFilter)))
        && (postFilter === 'all' || post.post_type === postFilter)
        && (mediaFilter === 'all' || post.media.some((media) => media.media_type === mediaFilter))
    })
    .sort((a, b) => {
      const result = new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
      return sort === 'latest' ? result : -result
    })
  return (
    <div className="space-y-6">
      <NewPostForm characters={characters} profiles={profiles} />
      <section className="space-y-3"><div><h2 className="text-sm font-bold text-white">등록된 게시물</h2><p className="mt-1 text-xs text-zinc-500">총 {filteredPosts.length}개 / 전체 {posts.length}개</p></div>
        <div className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="프로필·캐릭터·본문 검색" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none" />
          <Select value={characterFilter} onChange={setCharacterFilter} options={characterFilterOptions} searchable searchPlaceholder="캐릭터 검색" fullWidth />
          <Select value={organizationFilter} onChange={setOrganizationFilter} options={organizationFilterOptions} searchable searchPlaceholder="조직 검색" fullWidth />
          <Select value={postFilter} onChange={setPostFilter} options={postFilterOptions} fullWidth />
          <Select value={mediaFilter} onChange={setMediaFilter} options={mediaFilterOptions} fullWidth />
          <Select value={sort} onChange={setSort} options={sortOptions} fullWidth />
        </div>
        {filteredPosts.length === 0 ? <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-12 text-center text-sm text-zinc-600">조건에 맞는 Bongstagram 게시물이 없습니다.</div> : filteredPosts.map((post) => { const character = characterById.get(post.character_id); const profile = profileByCharacterId.get(post.character_id); if (!character || !profile) return null; return <PostEditRow key={post.id} post={post} character={character} profile={profile} comments={comments} /> })}
      </section>
    </div>
  )
}
