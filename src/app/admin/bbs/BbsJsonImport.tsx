'use client'

import { useRef, useState } from 'react'
import { FileJson, Upload } from 'lucide-react'
import { importBbsArticles, type BbsImportRow } from './actions'

const categoryLabels: Record<string, string> = { info: 'info', incident: 'incident', economy: 'economy', column: 'column', etc: 'other', other: 'other' }

function escapeText(value: string) {
  return value.replace(/[\\`*_{}\[\]()#+.!|>~-]/g, '\\$&')
}

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(node.textContent ?? '')
  if (!(node instanceof HTMLElement)) return [...node.childNodes].map(inline).join('')
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

function block(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText((node.textContent ?? '').replace(/\s+/g, ' ').trim())
  if (!(node instanceof HTMLElement)) return [...node.childNodes].map(block).filter(Boolean).join('\n\n')
  const tag = node.tagName.toLowerCase()
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

export default function BbsJsonImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('JSON 파일을 선택하면 비공개 기사로 저장합니다.')

  async function handleFile(file: File) {
    setPending(true)
    try {
      const rows = parseRows(await file.text())
      const result = await importBbsArticles(rows)
      setMessage(`신규 ${result.imported}건 저장 · 중복 ${result.skipped}건 건너뜀${result.errors.length ? ` · 오류 ${result.errors.length}건` : ''}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'JSON 파일을 처리하지 못했습니다.')
    } finally {
      setPending(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return <div className="flex flex-wrap items-center gap-2"><input ref={inputRef} type="file" accept=".json,application/json" className="sr-only" disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file) }} /><button type="button" onClick={() => inputRef.current?.click()} disabled={pending} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-amber-400/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"><FileJson size={13} />{pending ? '가져오는 중...' : 'JSON 기사 가져오기'}</button><span className="flex items-center gap-1 text-[11px] text-zinc-600"><Upload size={12} />{message}</span></div>
}
