'use client'

import { FileJson, Upload } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { importBbsComments, type BbsCommentImportRow } from './actions'

type CommentPayload = { comments?: unknown[] } | unknown[]

function parseRows(raw: string): BbsCommentImportRow[] {
  const parsed = JSON.parse(raw) as CommentPayload
  const rows = Array.isArray(parsed) ? parsed : parsed.comments
  if (!Array.isArray(rows)) throw new Error('comments 배열을 찾을 수 없습니다.')

  return rows.map((item) => {
    const row = item as Record<string, unknown>
    return {
      author: String(row.author ?? row.authorName ?? row.name ?? ''),
      content: String(row.content ?? row.text ?? ''),
      createdAt: String(row.createdAt ?? row.created_at ?? row.date ?? ''),
    }
  })
}

export default function BbsCommentImport({ articleId }: { articleId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [message, setMessage] = useState('정제기에서 복사한 JSON을 붙여 넣어 주세요.')
  const [isPending, startTransition] = useTransition()

  function handleFile(file: File) {
    void file.text().then(setValue).catch(() => setMessage('JSON 파일을 읽지 못했습니다.'))
  }

  function importComments() {
    setMessage('')
    try {
      const rows = parseRows(value)
      startTransition(async () => {
        const result = await importBbsComments(articleId, rows)
        if (result.error) {
          setMessage(result.error)
          return
        }
        const unmatched = result.unmatchedAuthors.length ? ` · 캐릭터 미연결 ${result.unmatchedAuthors.join(', ')}` : ''
        setMessage(`등록 ${result.imported}개 · 중복/무효 건너뜀 ${result.skipped}개${unmatched}`)
        if (result.imported > 0) setValue('')
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '댓글 JSON 형식을 확인해 주세요.')
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold text-zinc-400">외부 댓글 JSON 일괄 등록</p>
          <p className="mt-0.5 text-[10px] text-zinc-600">작성자명이 캐릭터와 일치하면 자동 연결하고, 일치하지 않아도 이름을 보존해 등록합니다.</p>
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-amber-400/60 hover:text-amber-300">
          <FileJson size={12} /> JSON 파일 선택
          <input ref={inputRef} type="file" accept=".json,application/json" className="sr-only" disabled={isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file); event.currentTarget.value = '' }} />
        </label>
      </div>
      <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={4} disabled={isPending} placeholder={'{"title":"기사 제목","comments":[{"author":"호남선","createdAt":"2026.10.04 18:23","content":"댓글 내용"}]}' } className="mt-2 block w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-700 focus:border-amber-400/60 focus:outline-none disabled:opacity-50" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={importComments} disabled={isPending || !value.trim()} className="flex cursor-pointer items-center gap-1.5 rounded-md bg-amber-400 px-3 py-1.5 text-[11px] font-bold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"><Upload size={12} />{isPending ? '등록 중...' : '댓글 일괄 등록'}</button>
        <span className="text-[11px] text-zinc-600">{message}</span>
      </div>
    </div>
  )
}
