"use client"

import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Shortcut } from '@/api/shortcuts'
import { cn } from '@/lib/utils'

interface ShortcutsGridProps {
  shortcuts: Shortcut[]
  showSuggestions: boolean
  query: string
  animated?: boolean
  onOpenShortcut: (url: string) => void
  onEditShortcut: (shortcut: Shortcut) => void
  onDeleteShortcut: (id: string, title: string) => void
  onMoveShortcutUp: (id: string) => void
  onMoveShortcutDown: (id: string) => void
  onAddShortcut: () => void
  getHostname: (url: string) => string
  getShortcutIcon: (title: string, icon: string) => ReactNode
}

export function ShortcutsGrid({
  shortcuts,
  showSuggestions,
  query,
  onOpenShortcut,
  onEditShortcut,
  onDeleteShortcut,
  onMoveShortcutUp,
  onMoveShortcutDown,
  onAddShortcut,
  getHostname,
  getShortcutIcon,
}: ShortcutsGridProps) {
  return (
    <div
      className={cn(
        'relative z-10 grid w-full max-w-[960px] grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-10',
        showSuggestions && query.trim() && 'pointer-events-none',
      )}
      onClick={(event) => event.stopPropagation()}
    >
      {shortcuts.map((shortcut) => (
        <div key={shortcut.id} className="group relative mx-auto flex w-20 flex-col items-center">
          <button
            type="button"
            className="group/icon flex w-full cursor-pointer flex-col items-center gap-5 transition-transform duration-200"
            onClick={() => onOpenShortcut(shortcut.url)}
            aria-label={`Open ${shortcut.title}`}
            title={getHostname(shortcut.url)}
          >
            <div className="cards flex h-20 w-20 items-center justify-center overflow-hidden rounded-[26px] border border-white/15 shadow-xl [--card-hover-scale:1.06] [--card-active-scale:0.96]">
              <div className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover/icon:scale-110">
                {getShortcutIcon(shortcut.title, shortcut.icon)}
              </div>
            </div>

            <div className="absolute top-[110%] whitespace-nowrap rounded-xl border border-white/15 bg-black/40 px-3 py-1 text-sm font-medium tracking-[0.1em] text-white/95 opacity-0 transition-all duration-300 translate-y-2 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)] [-webkit-backdrop-filter:blur(10px)] [backdrop-filter:blur(10px)] group-hover/icon:translate-y-0 group-hover/icon:opacity-100">
              {shortcut.title}
            </div>
          </button>

          <div className="absolute -top-2 left-1/2 z-20 flex -translate-x-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              aria-label={`Move ${shortcut.title} up`}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/70 [-webkit-backdrop-filter:blur(8px)] [backdrop-filter:blur(8px)] transition-all hover:bg-black/70 hover:text-white hover:scale-110"
              onClick={(event) => {
                event.stopPropagation()
                onMoveShortcutUp(shortcut.id)
              }}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Move ${shortcut.title} down`}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/70 [-webkit-backdrop-filter:blur(8px)] [backdrop-filter:blur(8px)] transition-all hover:bg-black/70 hover:text-white hover:scale-110"
              onClick={(event) => {
                event.stopPropagation()
                onMoveShortcutDown(shortcut.id)
              }}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Edit ${shortcut.title}`}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/70 [-webkit-backdrop-filter:blur(8px)] [backdrop-filter:blur(8px)] transition-all hover:bg-black/70 hover:text-white hover:scale-110"
              onClick={(event) => {
                event.stopPropagation()
                onEditShortcut(shortcut)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Remove ${shortcut.title}`}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-red-300/40 bg-red-950/50 text-red-200 [-webkit-backdrop-filter:blur(8px)] [backdrop-filter:blur(8px)] transition-all hover:bg-red-900/70 hover:text-red-100 hover:scale-110"
              onClick={(event) => {
                event.stopPropagation()
                onDeleteShortcut(shortcut.id, shortcut.title)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="group/add flex cursor-pointer flex-col items-center gap-5 transition-transform duration-200"
        onClick={onAddShortcut}
        aria-label="Add shortcut"
      >
        <div className="cards flex h-20 w-20 items-center justify-center rounded-[26px] border-2 border-dashed border-white/25 bg-black/15 transition-all duration-300 group-hover/add:border-white/50 group-hover/add:bg-black/30 [--card-hover-scale:1.06] [--card-active-scale:0.96]">
          <Plus className="h-9 w-9 stroke-[1.5] text-white/40 transition-all duration-300 group-hover/add:rotate-90 group-hover/add:text-white/90" />
        </div>
        <div className="absolute top-[110%] translate-y-2 rounded-xl border border-white/15 bg-black/40 px-3 py-1 text-sm font-medium tracking-wider text-white/80 opacity-0 transition-all duration-300 [-webkit-backdrop-filter:blur(10px)] [backdrop-filter:blur(10px)] group-hover/add:translate-y-0 group-hover/add:opacity-100">
          New Link
        </div>
      </button>
    </div>
  )
}
