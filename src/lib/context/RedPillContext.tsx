'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'

type RedPillContextType = {
  isRedPill: boolean
  toggle: () => void
}

const RedPillContext = createContext<RedPillContextType>({
  isRedPill: false,
  toggle: () => {},
})

export function RedPillProvider({ children }: { children: React.ReactNode }) {
  const isRedPill = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('redpill-change', onStoreChange)
      window.addEventListener('storage', onStoreChange)
      return () => {
        window.removeEventListener('redpill-change', onStoreChange)
        window.removeEventListener('storage', onStoreChange)
      }
    },
    () => localStorage.getItem('redpill') === 'true',
    () => false
  )

  const toggle = () => {
    localStorage.setItem('redpill', String(!isRedPill))
    window.dispatchEvent(new Event('redpill-change'))
  }

  return (
    <RedPillContext.Provider value={{ isRedPill, toggle }}>
      {children}
    </RedPillContext.Provider>
  )
}

export function useRedPill() {
  return useContext(RedPillContext)
}
