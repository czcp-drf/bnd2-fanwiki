'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

type BongstagramTheme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'bongstagram-theme'
const THEME_CHANGE_EVENT = 'bongstagram-theme-change'

function getStoredTheme(): BongstagramTheme {
  if (typeof window === 'undefined') return 'dark'
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return savedTheme === 'light' ? 'light' : 'dark'
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange)
}

function getServerTheme(): BongstagramTheme {
  return 'dark'
}

export function BongstagramThemeToggle({ disabled = false }: { disabled?: boolean }) {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, getServerTheme)
  const isLight = theme === 'light'

  useEffect(() => {
    document.documentElement.dataset.bongstagramTheme = theme
  }, [theme])

  function toggleTheme() {
    if (disabled) return
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={disabled}
      aria-label={disabled ? '테마 전환 비활성화' : isLight ? '다크 모드로 전환' : '라이트 모드로 전환'}
      title={disabled ? '테마 전환 비활성화' : isLight ? '다크 모드' : '라이트 모드'}
      className={disabled
        ? 'cursor-not-allowed text-zinc-700'
        : 'cursor-pointer text-zinc-400 transition-colors hover:text-zinc-100'}
    >
      {isLight ? <Moon size={22} /> : <Sun size={22} />}
    </button>
  )
}
