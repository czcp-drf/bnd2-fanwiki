'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { handleDropdownKeyDown } from '@/lib/dropdown-keyboard'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import DropdownPortal from './DropdownPortal'

export type SelectOption =
  | { value: string; label: string; separator?: never }
  | { separator: true; label: string; value?: never }

export default function Select({
  value,
  onChange,
  options,
  placeholder = '선택',
  searchPlaceholder = '검색',
  className,
  fullWidth = false,
  disabled = false,
  searchable = false,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  fullWidth?: boolean
  disabled?: boolean
  searchable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && !document.getElementById(listId)?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [listId])

  const selected = options.find((o): o is { value: string; label: string } => !o.separator && o.value === value)
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const visibleOptions = options.filter((option) =>
    option.separator || !normalizedSearch || option.label.toLocaleLowerCase().includes(normalizedSearch)
  )
  const hasSearchResults = visibleOptions.some((option) => !option.separator)

  return (
    <div ref={ref} className={cn('relative', className)}
      onKeyDown={(event) => { if (!disabled) handleDropdownKeyDown(event, open, setOpen) }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && !document.getElementById(listId)?.contains(event.relatedTarget)) setOpen(false) }}>
      <button
        type="button"
        disabled={disabled}
        data-dropdown-trigger
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (!open && searchable) setSearch('')
          setOpen((v) => !v)
        }}
        className={cn(
          `flex ${fullWidth ? 'w-full' : 'w-36'} items-center justify-between gap-2 rounded-lg border bg-zinc-900 px-3 py-1.5 text-xs transition-colors focus:outline-none`,
          open
            ? 'border-amber-400/50 text-zinc-200'
            : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
        )}
      >
        <span className="whitespace-nowrap truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={12}
          className={cn('shrink-0 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && !disabled && (
        <DropdownPortal anchor={ref}>
        <div id={listId} role="listbox" aria-label={placeholder}>
          {searchable && (
            <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900 p-2">
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
              />
            </div>
          )}
          {visibleOptions.map((opt, i) =>
            opt.separator ? (
              <div
                key={`sep-${i}`}
                className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none bg-zinc-800/60 border-t border-zinc-800 first:border-t-0"
              >
                {opt.label}
              </div>
            ) : (
              <button
                key={opt.value}
                data-dropdown-option
                role="option"
                aria-selected={opt.value === value}
                tabIndex={-1}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                  setSearch('')
                  ref.current?.querySelector<HTMLButtonElement>('[data-dropdown-trigger]')?.focus()
                }}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-xs transition-colors focus:bg-zinc-700 focus:text-white focus:outline-none',
                  opt.value === value
                    ? 'bg-amber-400/10 text-amber-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                )}
              >
                {opt.label}
              </button>
            )
          )}
          {searchable && normalizedSearch && !hasSearchResults && (
            <p className="px-3 py-3 text-center text-xs text-zinc-600">검색 결과가 없습니다.</p>
          )}
        </div>
        </DropdownPortal>
      )}
    </div>
  )
}
