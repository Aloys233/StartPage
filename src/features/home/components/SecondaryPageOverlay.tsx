"use client"

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SecondaryPageOverlayProps {
  open: boolean
  onClose: () => void
  authSlot: ReactNode
  children: ReactNode
}

/*
 * backdrop-filter 关键约束（务必遵守，否则模糊会失效或闪烁）：
 * 模糊层自身不能位于任何带 opacity / transform / filter 的祖先之下 ——
 * 这类祖先会建立新的 backdrop root，使后代 backdrop-filter 采样到空白。
 * 因此：淡入动画只由模糊层自己承担；内容层用 visibility 切换（visibility 不产生 backdrop root）。
 */
export function SecondaryPageOverlay({ open, onClose, authSlot, children }: SecondaryPageOverlayProps) {
  return (
    <div
      className={cn('fixed inset-0 z-40', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
      onContextMenu={(event) => {
        event.preventDefault()
      }}
    >
      {/*
       * 与首页搜索聚焦遮罩同源：纯高斯模糊虚化背景，绝无黑色遮罩压暗。
       *
       * 只在打开时挂载，关闭时直接卸载（不靠 opacity:0 留在合成树里）。
       * 关闭后合成器可能残留搜索卡那块过期的 backdrop 纹理，由 SecondaryPage
       * 在关闭的同一帧里强制重绘一次来清掉。
       * 淡入交给 globals.css 的 .overlay-blur-mask（@starting-style）。
       */}
      {open && (
        <button
          type="button"
          className="overlay-blur-mask absolute inset-0 backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]"
          aria-label="Close secondary page"
          onClick={onClose}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        className={cn('pointer-events-none relative z-10 min-h-screen', open ? 'visible' : 'invisible')}
      >
        <div className="pointer-events-none absolute top-6 right-6 left-6 flex justify-end">
          <div
            className={cn('w-full max-w-[760px]', open ? 'pointer-events-auto' : 'pointer-events-none')}
            onClick={(event) => event.stopPropagation()}
          >
            {authSlot}
          </div>
        </div>

        <div className="pointer-events-none flex min-h-screen items-center justify-center px-6 py-20">
          <div
            className={cn('w-full max-w-[1100px]', open ? 'pointer-events-auto' : 'pointer-events-none')}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
