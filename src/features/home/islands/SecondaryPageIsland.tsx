"use client"

import { useEffect, useState } from 'react'
import { SecondaryPageOverlay } from '@/features/home/components/SecondaryPageOverlay'
import { SecondaryShortcutDeck } from '@/features/home/components/SecondaryShortcutDeck'
import { isTypingTarget } from '@/features/home/shortcuts'
import { AuthIsland } from '@/features/home/islands/AuthIsland'
import { LogtoAuth } from '@/components/LogtoAuth'

export function SecondaryPageIsland() {
  return (
    <LogtoAuth>
      <SecondaryPageContent />
    </LogtoAuth>
  )
}

function SecondaryPageContent() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    if (open) {
      root.classList.add('secondary-page-open')
    } else {
      root.classList.remove('secondary-page-open')
    }

    return () => {
      root.classList.remove('secondary-page-open')
    }
  }, [open])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 2) {
        return
      }

      if (!open && isTypingTarget(event.target)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (!open) {
        setOpen(true)
      }
    }

    const onContextMenu = (event: MouseEvent) => {
      if (!open && isTypingTarget(event.target)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (!open) {
        setOpen(true)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!open) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('contextmenu', onContextMenu, true)
    document.addEventListener('contextmenu', onContextMenu, true)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('contextmenu', onContextMenu, true)
      document.removeEventListener('contextmenu', onContextMenu, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <SecondaryPageOverlay open={open} onClose={() => setOpen(false)} authSlot={<AuthIsland />}>
      <SecondaryShortcutDeck />
    </SecondaryPageOverlay>
  )
}
