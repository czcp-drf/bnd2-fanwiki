'use client'

import { useActionState } from 'react'
import { login } from './actions'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-white">
            봉누도<span className="text-amber-400">2</span> 관리자
          </h1>
          <p className="text-sm text-zinc-500">관리자 비밀번호를 입력하세요.</p>
        </div>

        <form action={action} className="space-y-3">
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            required
            autoFocus
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-400/50 focus:outline-none"
          />
          {state?.error && (
            <p className="text-xs text-red-400">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-amber-400 py-2.5 text-sm font-bold text-zinc-900 hover:bg-amber-300 transition-colors disabled:opacity-50"
          >
            {pending ? '확인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
