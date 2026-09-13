import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { RedPillProvider } from '@/lib/context/RedPillContext'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: '봉누도 따라가기',
    template: '%s | 봉누도 따라가기',
  },
  description: '봉누도 따라가기',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: '봉누도 따라가기',
    description: '봉누도 따라가기',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '봉누도 따라가기',
    description: '봉누도 따라가기',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const theme = window.localStorage.getItem('bongstagram-theme') === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.bongstagramTheme = theme;
  } catch {}
})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <RedPillProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </RedPillProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
