"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { SecondaryPageOverlay } from '@/features/home/components/SecondaryPageOverlay'
import { AuthMenu } from '@/features/home/components/AuthMenu'
import { isTypingTarget } from '@/features/home/shortcuts'

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

export function SecondaryPage() {
  const [open, setOpen] = useState(false)

  const openSecondaryPage = () => {
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
    <SecondaryPageOverlay open={open} onClose={() => setOpen(false)} authSlot={<AuthMenu />}>
      {/*
       * 关闭时必须真正卸载抽屉内容，不能像以前那样用 hasEverOpened 把它留在树里。
       *
       * 只是把内容切成 invisible 的话，抽屉里数十个带 backdrop-filter 的卡片
       * 仍然留在渲染树里、且与一级页面的搜索卡处在同一区域；关闭那一刻它们
       * 从可见变不可见，会让合成器里搜索卡那份 backdrop 采样变成陈旧快照 ——
       * 表现就是返回一级页面时搜索框那一带残留一块比卡片略大的硬边模糊矩形，
       * 而且要等下一次无关重绘（秒针跳字）才消失。卸载即彻底消除。
       */}
      {open ? <SecondaryShortcutDeck /> : null}
    </SecondaryPageOverlay>
  )
}
