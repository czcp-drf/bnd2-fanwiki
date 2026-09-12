import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { RedPillProvider } from '@/lib/context/RedPillContext'
import VercelAnalytics from '@/components/VercelAnalytics'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: '봉누도2 위키',
    template: '%s | 봉누도2 위키',
  },
  description: 'GTA RP 서버 봉누도2의 스트리머, 캐릭터, 사건을 정리한 팬사이트',
  openGraph: {
    title: '봉누도2 위키',
    description: 'GTA RP 서버 봉누도2의 스트리머, 캐릭터, 사건을 정리한 팬사이트',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '봉누도2 위키',
    description: 'GTA RP 서버 봉누도2의 스트리머, 캐릭터, 사건을 정리한 팬사이트',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <RedPillProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </RedPillProvider>
        <VercelAnalytics />
      </body>
    </html>
  )
}
