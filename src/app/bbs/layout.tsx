import type { ReactNode } from 'react'
import BbsQueryProvider from './components/BbsQueryProvider'

export default function BbsLayout({ children }: { children: ReactNode }) {
  return <BbsQueryProvider>{children}</BbsQueryProvider>
}
