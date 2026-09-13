'use client'

import { useState, type ReactNode } from 'react'
import { Images, MessageCircle } from 'lucide-react'

type AdminTab = 'comments' | 'posts'

export default function BongstagramAdminTabs({ comments, posts }: { comments: ReactNode; posts: ReactNode }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('posts')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1" role="tablist" aria-label="Bongstagram 관리 메뉴">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'posts'}
          onClick={() => setActiveTab('posts')}
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${activeTab === 'posts' ? 'bg-fuchsia-400 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'}`}
        >
          <Images size={16} />
          게시물 관리
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'comments'}
          onClick={() => setActiveTab('comments')}
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${activeTab === 'comments' ? 'bg-fuchsia-400 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'}`}
        >
          <MessageCircle size={16} />
          댓글 관리
        </button>
      </div>

      <div role="tabpanel" aria-label={activeTab === 'comments' ? '댓글 관리' : '게시물 관리'}>
        {activeTab === 'comments' ? comments : posts}
      </div>
    </div>
  )
}
