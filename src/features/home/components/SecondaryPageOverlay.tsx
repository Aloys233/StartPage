"use client"

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SecondaryPageOverlayProps {
  open: boolean
  onClose: () => void
  authSlot: ReactNode
  children: ReactNode
}

export function SecondaryPageOverlay({ open, onClose, authSlot, children }: SecondaryPageOverlayProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-40 transition-opacity duration-220 ease-out',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!open}
      onContextMenu={(event) => {
        event.preventDefault()
      }}
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-black/50 transition-[opacity,backdrop-filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'opacity-100 backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)]' : 'opacity-0 backdrop-blur-0 pointer-events-none',
        )}
        aria-label="Close secondary page"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'pointer-events-none relative z-10 min-h-screen transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4',
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute top-6 right-6 left-6 flex justify-end transition-opacity duration-180 ease-out',
            open ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div
            className={cn('w-full max-w-[760px]', open ? 'pointer-events-auto' : 'pointer-events-none')}
            onClick={(event) => event.stopPropagation()}
          >
            {authSlot}
          </div>
        </div>

        <div className="pointer-events-none flex min-h-screen items-center justify-center px-6 py-20">
          <div
            className={cn(
              'w-full max-w-[1100px] transition-opacity duration-180 ease-out',
              open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
