'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X } from 'lucide-react'
import { deleteEvent } from './actions'

export default function EventDeleteButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (confirm) {
    return (
      <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <button
          onClick={async () => {
            setPending(true)
            setError('')
            try {
              const result = await deleteEvent(id)
              if (result?.error) {
                setError(result.error)
                setPending(false)
              } else {
                router.push('/admin/events')
              }
            } catch {
              setError('삭제 중 오류가 발생했습니다.')
              setPending(false)
            }
          }}
          disabled={pending}
          className="cursor-pointer rounded px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
        >
          {pending ? '…' : '삭제'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="cursor-pointer rounded p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="cursor-pointer rounded p-1 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
    >
      <Trash2 size={13} />
    </button>
  )
}
