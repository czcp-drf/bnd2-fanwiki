import type { KeyboardEvent } from 'react'

export function handleDropdownKeyDown(
  event: KeyboardEvent<HTMLElement>,
  open: boolean,
  setOpen: (open: boolean) => void,
) {
  const root = event.currentTarget
  const trigger = root.querySelector<HTMLElement>('[data-dropdown-trigger]')
  if (event.key === 'Tab') {
    if (!root.contains(document.activeElement)) trigger?.focus()
    setOpen(false)
    return
  }
  if (event.key === 'Escape' && open) {
    event.preventDefault()
    event.stopPropagation()
    setOpen(false)
    trigger?.focus()
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  if (event.target instanceof HTMLInputElement && ['Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const move = () => {
    const menuId = trigger?.getAttribute('aria-controls')
    const menu = (menuId && document.getElementById(menuId)) || root
    const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('[data-dropdown-option]:not(:disabled)'))
    if (!items.length) return
    const current = items.findIndex((item) => item === document.activeElement)
    const selected = items.findIndex((item) => item.getAttribute('aria-selected') === 'true')
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : current < 0 ? selected >= 0 ? selected : event.key === 'ArrowUp' ? items.length - 1 : 0
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[index].focus()
    items[index].scrollIntoView({ block: 'nearest' })
  }
  if (!open) { setOpen(true); requestAnimationFrame(move) } else move()
}
