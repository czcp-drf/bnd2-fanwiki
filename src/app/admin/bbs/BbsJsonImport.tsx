'use client'

import { useRef, useState } from 'react'
import { Download, FileJson, Upload } from 'lucide-react'
import { importBbsArticleWithOriginalUrls, importBbsArticles, type BbsImportFailure, type BbsImportRow } from './actions'
import { isHttpUrl } from '@/lib/bbs/media-url'

const categoryLabels: Record<string, string> = { info: 'info', incident: 'incident', economy: 'economy', column: 'column', etc: 'other', other: 'other' }

function escapeText(value: string) {
  return value.replace(/[\\`*_{}\[\]()#+.!|>~-]/g, '\\$&')
}

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(node.textContent ?? '')
  if (!(node instanceof HTMLElement)) return [...node.childNodes].map(inline).join('')
  if (node.tagName.toLowerCase() === 'video') return videoMarkdown(node)
  const content = [...node.childNodes].map(inline).join('')
  const tag = node.tagName.toLowerCase()
  if (tag === 'strong' || tag === 'b') return content.trim() ? `**${content.trim()}**` : ''
  if (tag === 'em' || tag === 'i') return content.trim() ? `*${content.trim()}*` : ''
  if (['s', 'del', 'strike'].includes(tag)) return content.trim() ? `~~${content.trim()}~~` : ''
  if (tag === 'br') return '\n'
  if (tag === 'code') return content.trim() ? `\`${content.trim().replace(/`/g, '\\`')}\`` : ''
  if (tag === 'a') {
    const href = node.getAttribute('href') ?? ''
    return /^https?:\/\//i.test(href) ? `[${content.trim() || escapeText(href)}](<${href}>)` : content
  }
  if (tag === 'img') {
    const src = node.getAttribute('src') ?? ''
    return /^https?:\/\//i.test(src) ? `![기사 이미지](${src})` : ''
  }
  return content
}

function videoMarkdown(node: HTMLElement) {
  const src = node.getAttribute('src') ?? node.querySelector('source[src]')?.getAttribute('src') ?? ''
  return isHttpUrl(src) ? `[기사 영상](<${src}>)` : ''
}

function block(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText((node.textContent ?? '').replace(/\s+/g, ' ').trim())
  if (!(node instanceof HTMLElement)) return [...node.childNodes].map(block).filter(Boolean).join('\n\n')
  const tag = node.tagName.toLowerCase()
  if (tag === 'video') return videoMarkdown(node)
  if (['script', 'style', 'noscript', 'iframe', 'svg', 'form', 'input', 'button'].includes(tag)) return ''
  if (/^h[1-3]$/.test(tag)) {
    const content = inline(node).trim()
    return content ? `${'#'.repeat(Number(tag[1]))} ${content}` : ''
  }
  if (['strong', 'b', 'em', 'i', 's', 'del', 'strike', 'a', 'code', 'br'].includes(tag)) return inline(node).trim()
  if (tag === 'p') return inline(node).trim()
  if (tag === 'blockquote') {
    const quote = [...node.childNodes].map(block).filter(Boolean).join('\n\n')
    return quote.split('\n').map((line) => line ? `> ${line}` : '>').join('\n')
  }
  if (tag === 'hr') return '---'
  if (tag === 'pre') {
    const code = node.textContent?.trim() ?? ''
    return code ? '```\n' + code.replace(/```/g, '\\`\\`\\`') + '\n```' : ''
  }
  if (tag === 'table') {
    const rows = [...node.querySelectorAll('tr')].map((row) => [...row.children].map((cell) => inline(cell).trim()))
    if (!rows.length) return ''
    const width = Math.max(...rows.map((row) => row.length))
    const header = [...rows[0], ...Array(Math.max(0, width - rows[0].length)).fill('')]
    const separator = header.map(() => '---')
    return [header, separator, ...rows.slice(1)].map((row) => `| ${[...row, ...Array(Math.max(0, width - row.length)).fill('')].join(' | ')} |`).join('\n')
  }
  if (tag === 'ul' || tag === 'ol') return [...node.children].filter((child) => child.tagName.toLowerCase() === 'li').map((child, index) => `${tag === 'ol' ? `${index + 1}.` : '-'} ${inline(child).trim()}`).join('\n')
  const content = [...node.childNodes].map(block).filter(Boolean).join('\n\n')
  return content || inline(node).trim()
}

function htmlToMarkdown(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return [...doc.body.childNodes].map(block).filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

function firstImageUrl(html: string, fallback: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const src = doc.querySelector('img[src]')?.getAttribute('src') ?? fallback
  return /^https?:\/\//i.test(src) ? src : ''
}

function parseRows(raw: string): BbsImportRow[] {
  const parsed = JSON.parse(raw) as { rows?: unknown[] } | unknown[]
  const rows = Array.isArray(parsed) ? parsed : parsed.rows
  if (!Array.isArray(rows)) throw new Error('rows 배열을 찾을 수 없습니다.')
  return rows.map((item, index) => {
    const row = item as Record<string, unknown>
    const body = String(row.body ?? row.content ?? '')
    return {
      externalId: String(row.id ?? row.articleId ?? `row-${index + 1}`),
      title: String(row.title ?? ''),
      category: categoryLabels[String(row.category ?? '').toLowerCase()] ?? 'other',
      content: htmlToMarkdown(body),
      thumbnailUrl: firstImageUrl(body, String(row.imageUrl ?? '')),
      reporterName: String(row.reporter ?? ''),
      reporterCharacterId: typeof row.reporterCharId === 'string' ? row.reporterCharId : undefined,
      approvedAt: String(row.publishedAt ?? row.approvedAt ?? ''),
    }
  })
}

function markdownValue(value: string) {
  return JSON.stringify(value ?? '')
}

function failedArticleMarkdown(failure: BbsImportFailure) {
  const { row, reason } = failure
  return [
    '---',
    `external_id: ${markdownValue(row.externalId)}`,
    `title: ${markdownValue(row.title)}`,
    `category: ${markdownValue(row.category)}`,
    `reporter: ${markdownValue(row.reporterName)}`,
    `reporter_character_id: ${markdownValue(row.reporterCharacterId ?? '')}`,
    `approved_at: ${markdownValue(row.approvedAt)}`,
    `thumbnail_url: ${markdownValue(row.thumbnailUrl)}`,
    `import_error: ${markdownValue(reason)}`,
    '---',
    '',
    row.content.trim() || '<!-- 본문 없음 -->',
    '',
  ].join('\n')
}

function safeFileName(value: string, fallback: string) {
  const name = value.trim().replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').slice(0, 100)
  return `${name || fallback}.md`
}

function downloadMarkdown(failure: BbsImportFailure) {
  const content = failedArticleMarkdown(failure)
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safeFileName(failure.row.title, `failed-article-${failure.index}`)
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function BbsJsonImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [originalUrlPending, setOriginalUrlPending] = useState<string | null>(null)
  const [failedRows, setFailedRows] = useState<BbsImportFailure[]>([])
  const [message, setMessage] = useState('JSON 파일의 이미지는 Supabase Storage로 이전한 뒤 비공개 기사로 저장합니다.')

  async function handleFile(file: File) {
    setPending(true)
    try {
      const rows = parseRows(await file.text())
      const result = await importBbsArticles(rows)
      setFailedRows(result.failedRows)
      setMessage(`신규 ${result.imported}건 저장 · 중복 ${result.skipped}건 건너뜀${result.errors.length ? ` · 오류 ${result.errors.length}건` : ''}${result.failedRows.length ? ` · 실패 MD ${result.failedRows.length}건` : ''}`)
    } catch (error) {
      setFailedRows([])
      setMessage(error instanceof Error ? error.message : 'JSON 파일을 처리하지 못했습니다.')
    } finally {
      setPending(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleOriginalUrlRegistration(failure: BbsImportFailure) {
    setOriginalUrlPending(failure.row.externalId)
    const result = await importBbsArticleWithOriginalUrls(failure.row)
    if (result.success) {
      setFailedRows((current) => current.filter((item) => item.row.externalId !== failure.row.externalId))
      setMessage(`원본 URL 기사 등록 완료 · ${failure.row.title || failure.row.externalId}`)
    } else {
      setMessage(result.error ?? '원본 URL 기사로 등록하지 못했습니다.')
    }
    setOriginalUrlPending(null)
  }

  return <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><input ref={inputRef} type="file" accept=".json,application/json" className="sr-only" disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file) }} /><button type="button" onClick={() => inputRef.current?.click()} disabled={pending} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-amber-400/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"><FileJson size={13} />{pending ? '가져오는 중...' : 'JSON 기사 가져오기'}</button><span className="flex items-center gap-1 text-[11px] text-zinc-600"><Upload size={12} />{message}</span></div>{failedRows.length > 0 && <div className="w-full rounded-lg border border-rose-500/20 bg-rose-500/5 p-3"><p className="text-xs font-semibold text-rose-300">가져오기 실패 기사 Markdown</p><p className="mt-1 text-[11px] text-zinc-500">메타데이터와 변환된 본문을 포함한 기사별 문서입니다. 이미지 이전 오류가 포함된 경우 원본 이미지 URL도 유지됩니다.</p><div className="mt-2 space-y-1.5">{failedRows.map((failure) => <div key={`${failure.index}-${failure.row.externalId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-2"><div className="min-w-0"><p className="truncate text-xs text-zinc-300">{failure.row.title || `기사 ${failure.index}`}</p><p className="truncate text-[11px] text-rose-300/80">{failure.reason}</p></div><div className="flex shrink-0 items-center gap-1.5"><button type="button" onClick={() => downloadMarkdown(failure)} className="flex cursor-pointer items-center gap-1 rounded-md border border-zinc-700 px-2 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-amber-400/60 hover:text-amber-300"><Download size={12} />.md 저장</button>{failure.canUseOriginalUrls && <button type="button" onClick={() => void handleOriginalUrlRegistration(failure)} disabled={originalUrlPending !== null} className="cursor-pointer rounded-md border border-amber-400/40 px-2 py-1.5 text-[11px] font-semibold text-amber-300 transition-colors hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-40">{originalUrlPending === failure.row.externalId ? '등록 중...' : '원본 URL로 등록'}</button>}</div></div>)}</div></div>}</div>
}
