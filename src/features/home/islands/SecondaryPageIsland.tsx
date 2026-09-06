"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { SecondaryPageOverlay } from '@/features/home/components/SecondaryPageOverlay'
import { isTypingTarget } from '@/features/home/shortcuts'
import { AuthIsland } from '@/features/home/islands/AuthIsland'
import { LogtoAuth } from '@/components/LogtoAuth'

// 延迟加载二级抽屉桌面，跳过服务端渲染，消除首屏数十个跨域 Favicon 的 preload 阻塞
const SecondaryShortcutDeck = dynamic(
  () => import('@/features/home/components/SecondaryShortcutDeck').then((m) => m.SecondaryShortcutDeck),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[66vh] min-h-[460px] items-center justify-center text-white/40">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    ),
  },
)

export function SecondaryPageIsland() {
  return (
    <LogtoAuth>
      <SecondaryPageContent />
    </LogtoAuth>
  )
}

function SecondaryPageContent() {
  const [open, setOpen] = useState(false)
  const [hasEverOpened, setHasEverOpened] = useState(false)

  const openSecondaryPage = () => {
    setHasEverOpened(true)
    setOpen(true)
  }

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
        openSecondaryPage()
      }
    }

    const onContextMenu = (event: MouseEvent) => {
      if (!open && isTypingTarget(event.target)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (!open) {
        openSecondaryPage()
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
      {open || hasEverOpened ? <SecondaryShortcutDeck /> : null}
    </SecondaryPageOverlay>
  )
}
