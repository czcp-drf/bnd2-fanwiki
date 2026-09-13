'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, MessageCircle, Pencil, Plus, ThumbsDown, ThumbsUp, Trash2, Upload, X } from 'lucide-react'
import AppImage from '@/components/ui/AppImage'
import Select, { type SelectOption } from '@/components/ui/Select'
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client'
import { createBbsArticle, createBbsUploadUrl, deleteBbsArticle, deleteBbsUploadedMedia, updateBbsArticle, type BbsArticleInput } from './actions'
import BbsArticleContent from '@/app/bbs/components/BbsArticleContent'
import BbsArticleCommentPanel from './BbsArticleCommentPanel'

type Reporter = { id: string; name: string; avatar_url: string | null; streamers: { display_name: string; profile_image_url: string | null } | null }
type Character = Reporter
type Comment = { id: string; article_id: string; author_character_id: string | null; author_name: string; content: string; created_at: string }
type Media = { id: string; image_url: string; sort_order: number }
type Article = {
  id: string
  title: string
  category: string
  summary: string | null
  content: string
  thumbnail_url: string | null
  approved_at: string | null
  is_published: boolean
  reporter_character_id: string
  like_count: number
  dislike_count: number
  media: Media[]
}
type MediaDraft = { imageUrl: string; storagePath?: string | null }

const categoryOptions: SelectOption[] = [
  { value: 'info', label: '정보' },
  { value: 'incident', label: '사건사고' },
  { value: 'economy', label: '경제' },
  { value: 'column', label: '칼럼' },
  { value: 'other', label: '기타' },
]

const statusOptions: SelectOption[] = [
  { value: 'all', label: '전체 공개 상태' },
  { value: 'published', label: '공개 기사' },
  { value: 'draft', label: '비공개 기사' },
]

const sortOptions: SelectOption[] = [
  { value: 'latest', label: '승인일시 최신순' },
  { value: 'oldest', label: '승인일시 오래된순' },
  { value: 'title', label: '제목순' },
  { value: 'likes-desc', label: '좋아요 많은순' },
  { value: 'likes-asc', label: '좋아요 적은순' },
  { value: 'dislikes-desc', label: '싫어요 많은순' },
  { value: 'dislikes-asc', label: '싫어요 적은순' },
]

const reactionFilterOptions: SelectOption[] = [
  { value: 'all', label: '전체 반응' },
  { value: 'liked', label: '좋아요 있음' },
  { value: 'disliked', label: '싫어요 있음' },
  { value: 'none', label: '반응 없음' },
]

type MarkdownTool = { label: string; title: string; action: 'plain' | 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'strike' | 'bullet' | 'ordered' }

const markdownTools: MarkdownTool[] = [
  { label: '본문', title: '본문 크기', action: 'plain' },
  { label: '제목 1', title: '제목 1', action: 'h1' },
  { label: '제목 2', title: '제목 2', action: 'h2' },
  { label: '제목 3', title: '제목 3', action: 'h3' },
  { label: 'B', title: '굵게', action: 'bold' },
  { label: 'I', title: '기울임', action: 'italic' },
  { label: 'S', title: '취소선', action: 'strike' },
  { label: '• 목록', title: '점 목록', action: 'bullet' },
  { label: '1. 목록', title: '번호 목록', action: 'ordered' },
]

function toLocalDateTime(value: string | null) {
  if (!value) return ''
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

function toIsoDateTime(value: string) {
  if (!value) return ''
  const date = new Date(`${value}:00+09:00`)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function formatDate(value: string | null) {
  if (!value) return '승인일시 없음'
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
}

function MarkdownEditor({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function replaceSelection(replacement: string, selectionStart: number, selectionEnd: number) {
    const textarea = textareaRef.current
    if (!textarea) return
    const nextValue = `${value.slice(0, textarea.selectionStart)}${replacement}${value.slice(textarea.selectionEnd)}`
    onChange(nextValue)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  function applyTool(action: MarkdownTool['action']) {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)

    if (action === 'plain' || action === 'h1' || action === 'h2' || action === 'h3' || action === 'bullet' || action === 'ordered') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const lineEndIndex = value.indexOf('\n', end)
      const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
      const lines = value.slice(lineStart, lineEnd).split('\n')
        // 인게임 편집기 기준으로 제목 3이 가장 크므로 Markdown heading 단계는 역순으로 사용한다.
        const prefix = action === 'h1' ? '### ' : action === 'h2' ? '## ' : action === 'h3' ? '# ' : action === 'bullet' ? '- ' : action === 'ordered' ? '1. ' : ''
      const transformed = lines.map((line, index) => {
        const withoutBlockPrefix = line.replace(/^#{1,3}\s+/, '')
        if (action === 'plain') return withoutBlockPrefix
        if (action === 'bullet') return /^[-*+]\s+/.test(withoutBlockPrefix) ? withoutBlockPrefix : `${prefix}${withoutBlockPrefix}`
        if (action === 'ordered') return /^\d+\.\s+/.test(withoutBlockPrefix) ? withoutBlockPrefix : `${index + 1}. ${withoutBlockPrefix}`
        return `${prefix}${withoutBlockPrefix}`
      }).join('\n')
      const nextValue = `${value.slice(0, lineStart)}${transformed}${value.slice(lineEnd)}`
      onChange(nextValue)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(lineStart, lineStart + transformed.length)
      })
      return
    }

    const marks = action === 'bold' ? ['**', '**'] : action === 'italic' ? ['*', '*'] : ['~~', '~~']
    const inner = selected || '텍스트'
    replaceSelection(`${marks[0]}${inner}${marks[1]}`, start + marks[0].length, start + marks[0].length + inner.length)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 focus-within:border-amber-400/60">
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800 bg-zinc-900 px-2 py-1.5">
        {markdownTools.map((tool) => <button key={tool.action} type="button" title={tool.title} onMouseDown={(event) => event.preventDefault()} onClick={() => applyTool(tool.action)} disabled={disabled} className="cursor-pointer rounded px-2 py-1 text-[11px] font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40">{tool.label}</button>)}
      </div>
      <textarea ref={textareaRef} value={value} maxLength={50000} onChange={(event) => onChange(event.target.value)} rows={14} className="block w-full resize-y border-0 bg-transparent px-3 py-3 text-sm leading-7 text-zinc-200 placeholder:text-zinc-600 focus:outline-none" placeholder="기사 본문을 입력해 주세요. 선택한 텍스트에 서식을 적용할 수 있습니다." disabled={disabled} />
      <p className="border-t border-zinc-800 px-3 py-2 text-[11px] text-zinc-600">Markdown 형식으로 저장되며 제목 3(가장 큼)·굵게·기울임·취소선·점 목록·번호 목록을 지원합니다.</p>
      {value.trim() && <div className="border-t border-zinc-800 px-3 py-4"><p className="mb-2 text-[11px] font-semibold text-zinc-600">미리보기</p><BbsArticleContent content={value} /></div>}
    </div>
  )
}

function ArticleForm({ article, reporters, onDone }: { article?: Article; reporters: Reporter[]; onDone: () => void }) {
  const isEdit = Boolean(article)
  const [title, setTitle] = useState(article?.title ?? '')
  const [category, setCategory] = useState(article?.category ?? 'other')
  const [content, setContent] = useState(article?.content ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(article?.thumbnail_url ?? '')
  const [reporterId, setReporterId] = useState(article?.reporter_character_id ?? '')
  const [approvedAt, setApprovedAt] = useState(toLocalDateTime(article?.approved_at ?? null))
  const [isPublished, setIsPublished] = useState(article?.is_published ?? false)
  const [media, setMedia] = useState<MediaDraft[]>(article?.media.sort((a, b) => a.sort_order - b.sort_order).map((item) => ({ imageUrl: item.image_url })) ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const supabase = createSupabaseBrowserClient()

  const reporterOptions: SelectOption[] = reporters.map((reporter) => ({ value: reporter.id, label: reporter.name }))
  const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none disabled:opacity-50'

  async function uploadFile(file: File, target: 'thumbnail' | 'media') {
    setError('')
    setUploading(true)
    try {
      const result = await createBbsUploadUrl({ fileName: file.name, contentType: file.type, size: file.size })
      if (result.error || !result.path || !result.token || !result.publicUrl) throw new Error(result.error ?? '업로드 주소를 만들지 못했습니다.')
      const { error: uploadError } = await supabase.storage.from('bbs-media').uploadToSignedUrl(result.path, result.token, file, { contentType: file.type })
      if (uploadError) throw new Error('이미지 업로드에 실패했습니다.')
      if (target === 'thumbnail') setThumbnailUrl(result.publicUrl)
      else setMedia((current) => [...current, { imageUrl: result.publicUrl, storagePath: result.path }])
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  function removeMedia(index: number) {
    const item = media[index]
    setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index))
    if (item?.imageUrl === thumbnailUrl) setThumbnailUrl('')
    if (item?.storagePath) void deleteBbsUploadedMedia([item.storagePath])
  }

  function save() {
    setError('')
    startTransition(async () => {
      const input: BbsArticleInput = { title, category, summary: article?.summary ?? '', content, thumbnailUrl, reporterCharacterId: reporterId, approvedAt: toIsoDateTime(approvedAt), isPublished, media }
      const result = isEdit ? await updateBbsArticle(article!.id, input) : await createBbsArticle(input)
      if (result.error) setError(result.error)
      else onDone()
    })
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-sm font-bold text-white">{isEdit ? '기사 수정' : '새 기사 등록'}</h2><p className="mt-1 text-xs text-zinc-500">승인일시는 한국 시간 기준으로 입력합니다.</p></div>
        <button type="button" onClick={onDone} className="cursor-pointer rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200" aria-label="기사 작성 취소"><X size={16} /></button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2"><span className="text-xs font-medium text-zinc-500">제목 *</span><input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="기사 제목" disabled={isPending || uploading} /></label>
        <label className="space-y-1.5"><span className="text-xs font-medium text-zinc-500">말머리 *</span><Select value={category} onChange={setCategory} options={categoryOptions} fullWidth disabled={isPending || uploading} /></label>
        <label className="space-y-1.5"><span className="text-xs font-medium text-zinc-500">담당기자 (언론 조직 소속) *</span><Select value={reporterId} onChange={setReporterId} options={reporterOptions} placeholder="담당기자 선택" searchable searchPlaceholder="기자 캐릭터 검색" fullWidth disabled={isPending || uploading} /></label>
        <label className="space-y-1.5"><span className="text-xs font-medium text-zinc-500">승인일시 (KST) {isPublished && '*'}</span><input type="datetime-local" value={approvedAt} onChange={(event) => setApprovedAt(event.target.value)} className={`${inputClass} [color-scheme:dark]`} disabled={isPending || uploading} /></label>
        <label className="flex items-end gap-2 pb-2 text-sm text-zinc-400"><input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} className="accent-amber-400" disabled={isPending || uploading} /> 공개 기사로 표시</label>
        <label className="space-y-1.5 md:col-span-2"><span className="text-xs font-medium text-zinc-500">본문</span><MarkdownEditor value={content} onChange={setContent} disabled={isPending || uploading} /><span className="block text-right text-[11px] text-zinc-600">{content.length}/50000</span></label>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-zinc-500">대표 이미지</span>
        <div className="flex flex-col gap-2 sm:flex-row"><input value={thumbnailUrl} onChange={(event) => setThumbnailUrl(event.target.value)} className={`${inputClass} flex-1`} placeholder="이미지 URL (선택)" disabled={isPending || uploading} /><label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"><Upload size={13} /> 파일 업로드<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" disabled={isPending || uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file, 'thumbnail'); event.currentTarget.value = '' }} /></label></div>
        {media.length > 0 && <div className="space-y-2"><p className="text-[11px] text-zinc-500">첨부 이미지에서 대표 이미지를 선택하면 같은 파일을 다시 업로드하지 않습니다.</p><div className="grid grid-cols-5 gap-2">{media.map((item, index) => <button key={`thumbnail-${item.imageUrl}-${index}`} type="button" onClick={() => setThumbnailUrl(item.imageUrl)} disabled={isPending || uploading} className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 bg-black transition-colors disabled:cursor-not-allowed ${thumbnailUrl === item.imageUrl ? 'border-amber-400' : 'border-zinc-800 hover:border-zinc-500'}`}><AppImage src={item.imageUrl} alt={`첨부 이미지 ${index + 1}에서 대표 이미지 선택`} fill sizes="100px" className="object-cover" />{thumbnailUrl === item.imageUrl && <span className="absolute inset-x-0 bottom-0 bg-amber-400/90 py-0.5 text-[9px] font-bold text-zinc-950">대표</span>}</button>)}</div></div>}
        {thumbnailUrl && <div className="relative h-32 w-56 overflow-hidden rounded-lg border border-zinc-800 bg-black"><AppImage src={thumbnailUrl} alt="대표 이미지 미리보기" fill sizes="224px" className="object-contain" /></div>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-xs font-medium text-zinc-500">첨부 이미지 ({media.length}/5)</span><label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"><Upload size={12} /> 이미지 추가<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple className="sr-only" disabled={isPending || uploading || media.length >= 5} onChange={(event) => { const files = Array.from(event.target.files ?? []).slice(0, 5 - media.length); files.forEach((file) => void uploadFile(file, 'media')); event.currentTarget.value = '' }} /></label></div>
        {media.length > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{media.map((item, index) => <div key={`${item.imageUrl}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-black"><AppImage src={item.imageUrl} alt={`첨부 이미지 ${index + 1}`} fill sizes="120px" className="object-cover" /><button type="button" onClick={() => removeMedia(index)} className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label={`첨부 이미지 ${index + 1} 삭제`}><Trash2 size={12} /></button></div>)}</div>}
        <p className="text-[11px] text-zinc-600">이미지 URL을 직접 입력하는 경우 아래 순서대로 한 장씩 추가할 수 있습니다.</p>
        <div className="space-y-2">{media.map((item, index) => <input key={`url-${index}`} value={item.imageUrl} onChange={(event) => setMedia((current) => current.map((mediaItem, mediaIndex) => mediaIndex === index ? { ...mediaItem, imageUrl: event.target.value, storagePath: null } : mediaItem))} className={inputClass} placeholder={`첨부 이미지 ${index + 1} URL`} disabled={isPending || uploading} />)}</div>
        <button type="button" onClick={() => setMedia((current) => current.length >= 5 ? current : [...current, { imageUrl: '' }])} disabled={isPending || uploading || media.length >= 5} className="flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"><Plus size={12} /> URL로 이미지 추가</button>
      </div>

      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center gap-2"><button type="button" onClick={save} disabled={isPending || uploading} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"><Check size={13} />{isPending ? '저장 중...' : isEdit ? '수정 저장' : '기사 등록'}</button><button type="button" onClick={onDone} disabled={isPending || uploading} className="cursor-pointer rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200">취소</button></div>
    </section>
  )
}

export default function BbsArticleManager({ articles, reporters, characters, comments }: { articles: Article[]; reporters: Reporter[]; characters: Character[]; comments: Comment[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Article | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [pendingEdit, setPendingEdit] = useState<Article | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [reporterId, setReporterId] = useState('all')
  const [reactionFilter, setReactionFilter] = useState('all')
  const [sort, setSort] = useState('latest')
  const [commentsOpenId, setCommentsOpenId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const reporterById = new Map(reporters.map((reporter) => [reporter.id, reporter]))
  const commentsByArticleId = new Map<string, Comment[]>()
  for (const comment of comments) {
    const current = commentsByArticleId.get(comment.article_id) ?? []
    current.push(comment)
    commentsByArticleId.set(comment.article_id, current)
  }
  const filteredArticles = articles.filter((article) => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return (!normalizedSearch || `${article.title} ${article.content} ${reporterById.get(article.reporter_character_id)?.name ?? ''}`.toLocaleLowerCase().includes(normalizedSearch))
      && (category === 'all' || article.category === category)
      && (status === 'all' || (status === 'published' ? article.is_published : !article.is_published))
      && (reporterId === 'all' || article.reporter_character_id === reporterId)
      && (reactionFilter === 'all' || (reactionFilter === 'liked' ? article.like_count > 0 : reactionFilter === 'disliked' ? article.dislike_count > 0 : article.like_count === 0 && article.dislike_count === 0))
  }).sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title, 'ko')
    if (sort === 'likes-desc') return b.like_count - a.like_count
    if (sort === 'likes-asc') return a.like_count - b.like_count
    if (sort === 'dislikes-desc') return b.dislike_count - a.dislike_count
    if (sort === 'dislikes-asc') return a.dislike_count - b.dislike_count
    const aTime = a.approved_at ? new Date(a.approved_at).getTime() : 0
    const bTime = b.approved_at ? new Date(b.approved_at).getTime() : 0
    return sort === 'oldest' ? aTime - bTime : bTime - aTime
  })

  function closeForm() {
    setEditing(null)
    setShowCreate(false)
    router.refresh()
  }

  function requestEdit(article: Article) {
    if (showCreate) {
      setPendingEdit(article)
      return
    }
    setShowCreate(false)
    setEditing(article)
  }

  function confirmEdit() {
    if (!pendingEdit) return
    setShowCreate(false)
    setEditing(pendingEdit)
    setPendingEdit(null)
  }

  function remove(article: Article) {
    if (!window.confirm(`'${article.title}' 기사를 삭제할까요?`)) return
    setError('')
    startTransition(async () => {
      const result = await deleteBbsArticle(article.id)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      {(showCreate || editing) && <ArticleForm key={editing?.id ?? 'new'} article={editing ?? undefined} reporters={reporters} onDone={closeForm} />}
      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-sm font-bold text-white">등록된 기사</h2><p className="mt-1 text-xs text-zinc-500">총 {filteredArticles.length}개 / 전체 {articles.length}개</p></div><button type="button" onClick={() => { setEditing(null); setShowCreate(true) }} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-amber-300"><Plus size={13} />새 기사 등록</button></div>
        <div className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_160px_160px_190px_160px_180px]"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="제목·본문·담당기자 검색" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none" /><Select value={category} onChange={setCategory} options={[{ value: 'all', label: '전체 말머리' }, ...categoryOptions]} fullWidth /><Select value={status} onChange={setStatus} options={statusOptions} fullWidth /><Select value={reporterId} onChange={setReporterId} options={[{ value: 'all', label: '전체 담당기자' }, ...reporters.map((reporter) => ({ value: reporter.id, label: reporter.name }))]} searchable searchPlaceholder="기자 검색" fullWidth /><Select value={reactionFilter} onChange={setReactionFilter} options={reactionFilterOptions} fullWidth /><Select value={sort} onChange={setSort} options={sortOptions} fullWidth /></div>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
        {filteredArticles.length === 0 ? <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-12 text-center text-sm text-zinc-600">조건에 맞는 기사가 없습니다.</div> : <div className="space-y-2">{filteredArticles.map((article) => { const reporter = reporterById.get(article.reporter_character_id); const articleComments = commentsByArticleId.get(article.id) ?? []; const commentsOpen = commentsOpenId === article.id; return <div key={article.id} className="space-y-2"><article className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center"><div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-950">{article.thumbnail_url ? <AppImage src={article.thumbnail_url} alt="" fill sizes="112px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-zinc-700">이미지 없음</div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-[11px]"><span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-amber-300">{categoryOptions.find((option) => !option.separator && option.value === article.category)?.label}</span><span className={article.is_published ? 'text-emerald-400' : 'text-zinc-500'}>{article.is_published ? '공개' : '비공개'}</span></div><h3 className="mt-1 line-clamp-2 text-sm font-bold text-zinc-100">{article.title}</h3><p className="mt-1 text-xs text-zinc-500">담당기자 {reporter?.name ?? '알 수 없음'} · {formatDate(article.approved_at)} · 첨부 {article.media.length}장</p><div className="mt-2 flex items-center gap-3 text-[11px]"><span className="inline-flex items-center gap-1 text-rose-400"><ThumbsUp size={12} fill="currentColor" />{article.like_count}</span><span className="inline-flex items-center gap-1 text-sky-400"><ThumbsDown size={12} fill="currentColor" />{article.dislike_count}</span></div></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => setCommentsOpenId(commentsOpen ? null : article.id)} className="flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"><MessageCircle size={12} />댓글 {articleComments.length}개<ChevronDown size={12} className={`transition-transform ${commentsOpen ? 'rotate-180' : ''}`} /></button><button type="button" onClick={() => requestEdit(article)} className="flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"><Pencil size={12} />수정</button><button type="button" onClick={() => remove(article)} disabled={isPending} className="flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={12} />삭제</button></div></article>{commentsOpen && <BbsArticleCommentPanel articleId={article.id} comments={articleComments} characters={characters} />}</div> })}</div>}
      </section>
      {pendingEdit && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="bbs-edit-warning-title" className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"><h2 id="bbs-edit-warning-title" className="text-base font-bold text-white">작성 중인 기사를 바꿀까요?</h2><p className="mt-2 text-sm leading-6 text-zinc-400">현재 등록 중인 기사 내용은 사라집니다. ‘{pendingEdit.title}’ 기사 수정으로 이동할까요?</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setPendingEdit(null)} className="cursor-pointer rounded-lg bg-zinc-800 px-3.5 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white">취소</button><button type="button" onClick={confirmEdit} className="cursor-pointer rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-amber-300">확인</button></div></div></div>}
    </div>
  )
}
