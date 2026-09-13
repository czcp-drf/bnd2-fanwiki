import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BongstagramBackButton from '../../BongstagramBackButton'
import BongstagramBottomNav from '../../BongstagramBottomNav'
import BongstagramPostGrid, { type BongstagramGridPost } from '../../BongstagramPostGrid'
import { extractBongstagramHashtags } from '@/lib/bongstagram/hashtags'
import { getBongstagramPosts } from '@/lib/bongstagram/public-data'

function decodeTag(value: string) {
  try {
    return decodeURIComponent(value).replace(/^#/, '').trim()
  } catch {
    return ''
  }
}

async function getHashtagPosts(rawTag: string) {
  const tag = decodeTag(rawTag)
  if (!tag || /[\s#]/.test(tag)) notFound()

  const posts = await getBongstagramPosts('post')

  const normalizedTag = tag.toLocaleLowerCase()
  const gridPosts: BongstagramGridPost[] = posts.flatMap((post) => {
    const matches = extractBongstagramHashtags(post.content).some((item) => item.toLocaleLowerCase() === normalizedTag)
    if (!matches) return []

    const media = post.media[0]
    return media ? [{ id: post.id, character_id: post.character_id, media_type: media.media_type, media_url: media.media_url }] : []
  })

  return { tag, posts: gridPosts }
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeTag(tag)
  return { title: `#${decodedTag} · Bongstagram` }
}

export default async function BongstagramHashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const data = await getHashtagPosts(tag)

  return (
    <div className="bongstagram-theme">
      <div className="bongstagram-font min-h-screen bg-zinc-950 pb-20">
        <div className="mx-auto min-h-screen w-full max-w-[540px] border-x border-zinc-900 bg-zinc-950">
          <header className="relative flex h-16 items-center border-b border-zinc-800 px-5">
            <BongstagramBackButton />
            <h1 className="absolute left-1/2 max-w-[70%] -translate-x-1/2 truncate text-lg font-semibold text-white">#{data.tag}</h1>
          </header>
          <BongstagramPostGrid posts={data.posts} />
        </div>
      </div>
      <BongstagramBottomNav />
    </div>
  )
}
