'use client'

import { useEffect, useState } from 'react'
import { Share } from 'lucide-react'

async function copyCurrentUrl() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(window.location.href)
    return
  }

  const input = document.createElement('textarea')
  input.value = window.location.href
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('copy failed')
}

export default function BbsShareButton({ className = '' }: { className?: string }) {
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const handleShare = async () => {
    try {
      await copyCurrentUrl()
      setToast('기사 링크를 복사했습니다.')
    } catch {
      setToast('기사 링크를 복사하지 못했습니다.')
    }
  }

  return (
    <>
      <button type="button" onClick={handleShare} className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--bbs-subtle-text)] transition-colors hover:bg-[var(--bbs-muted)] hover:text-[var(--bbs-text)] ${className}`} aria-label="기사 링크 복사">
        <Share size={18} />
      </button>
      {toast && <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg" role="status">{toast}</div>}
    </>
  )
}
