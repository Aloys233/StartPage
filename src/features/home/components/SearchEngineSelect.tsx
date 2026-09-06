"use client"

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchEngine } from '../types'

interface SearchEngineSelectProps {
  engine: SearchEngine
  engines: SearchEngine[]
  showEngineMenu: boolean
  onToggle: () => void
  onSelect: (engine: SearchEngine) => void
}

export function SearchEngineSelect({
  engine,
  engines,
  showEngineMenu,
  onToggle,
  onSelect,
}: SearchEngineSelectProps) {
  const CurrentIcon = engine.icon

  return (
    <div className="relative w-[176px] shrink-0">
      <button
        type="button"
        className="flex h-full min-h-14 w-full items-center gap-2 rounded-[24px] border border-white/10 bg-white/10 px-4 text-white outline-none transition-all hover:bg-white/15 hover:border-white/20 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        aria-label="Choose search engine"
        aria-expanded={showEngineMenu}
        onClick={onToggle}
      >
        <span className="text-base" style={{ color: engine.color }}>
          <CurrentIcon />
        </span>
        <span className="flex-1 truncate text-left text-[15px] font-medium leading-none">{engine.name}</span>
        <ChevronRight
          className={cn('h-[15px] w-[15px] rotate-90 opacity-55 transition-transform', showEngineMenu && 'rotate-[-90deg]')}
        />
      </button>
      {showEngineMenu && (
        <div className="absolute top-[calc(100%+10px)] left-0 z-50 w-64 rounded-2xl border border-white/15 p-2 text-white shadow-2xl glass-modal animate-fade duration-200">
          <div className="mb-1 px-3 py-1.5 text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase">
            Search Engine
          </div>
          <div className="mx-2 mb-1.5 border-t border-white/10" />
          {engines.map((item) => {
            const ItemIcon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'm-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-white/15',
                  engine.id === item.id && 'bg-white/20',
                )}
                onClick={() => onSelect(item)}
              >
                <span className="text-lg" style={{ color: item.color }}>
                  <ItemIcon />
                </span>
                <span className="text-[15px] font-medium">{item.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
