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
  className,
  fullWidth = false,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  fullWidth?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
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
        onClick={() => setOpen((v) => !v)}
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
          {options.map((opt, i) =>
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
        </div>
        </DropdownPortal>
      )}
    </div>
  )
}
