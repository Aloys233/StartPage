"use client"

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { SearchEngine } from '../types'

interface SearchEngineSelectProps {
  engine: SearchEngine
  engines: SearchEngine[]
  showEngineMenu: boolean
  portalContainer?: HTMLElement | null
  onToggle: () => void
  onSelect: (engine: SearchEngine) => void
}

export function SearchEngineSelect({
  engine,
  engines,
  showEngineMenu,
  portalContainer,
  onToggle,
  onSelect,
}: SearchEngineSelectProps) {
  const [mounted, setMounted] = useState(false)
  const CurrentIcon = engine.icon

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!showEngineMenu) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onToggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showEngineMenu, onToggle])

  const isPortal = mounted && Boolean(portalContainer)

  const menuDropdown = (
    <AnimatePresence>
      {showEngineMenu && (
        <motion.div
          key="engine-dropdown-menu"
          initial={{ opacity: 0, scale: 0.94, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{
            duration: 0.22,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ transformOrigin: 'top left' }}
          className={cn(
            'z-50 w-[320px] max-w-[calc(100vw-28px)] rounded-[24px] p-2.5 text-white glass-popover select-none',
            isPortal ? 'absolute top-[76px] left-[14px]' : 'absolute top-[calc(100%+8px)] left-0',
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {/* 标题提示 */}
          <div className="flex items-center justify-between px-3 pt-1 pb-1.5 text-[11px] font-semibold tracking-[0.18em] text-white/45 uppercase">
            <span>切换搜索引擎</span>
            <span className="font-mono text-[10px] tracking-normal text-white/30">{engines.length} 个选项</span>
          </div>

          <div className="mx-1.5 mb-2 border-t border-white/10" />

          {/* 搜索引擎 2 列网格 */}
          <div className="grid grid-cols-2 gap-1.5">
            {engines.map((item) => {
              const ItemIcon = item.icon
              const isSelected = engine.id === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={cn(
                    'group flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left outline-none transition-all duration-200',
                    isSelected
                      ? 'border border-white/20 bg-white/20 text-white shadow-sm'
                      : 'border border-transparent text-white/70 hover:border-white/10 hover:bg-white/12 hover:text-white active:scale-[0.97]',
                  )}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center text-base transition-transform duration-200 group-hover:scale-110"
                    style={{ color: item.color }}
                  >
                    <ItemIcon />
                  </span>
                  <span className="flex-1 truncate text-[13px] font-medium leading-none">
                    {item.name}
                  </span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-white/90" />
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="relative w-[176px] shrink-0">
      <button
        type="button"
        className={cn(
          'flex h-full min-h-14 w-full cursor-pointer select-none items-center gap-2.5 rounded-[24px] border px-4 text-white outline-none transition-all duration-200',
          showEngineMenu
            ? 'border-white/30 bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.08)]'
            : 'border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/15 active:scale-[0.98]',
          'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0',
        )}
        aria-label="Choose search engine"
        aria-expanded={showEngineMenu}
        onClick={onToggle}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center text-base transition-transform duration-200"
          style={{ color: engine.color }}
        >
          <CurrentIcon />
        </span>
        <span className="flex-1 truncate text-left text-[15px] font-medium leading-none tracking-wide">
          {engine.name}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 opacity-50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            showEngineMenu && 'rotate-180 opacity-90',
          )}
        />
      </button>

      {/* 当宿主容器就绪时挂载到搜索岛外层（脱离 .cards 的 backdrop 隔离），否则就地渲染 */}
      {isPortal && portalContainer
        ? createPortal(menuDropdown, portalContainer)
        : !portalContainer
          ? menuDropdown
          : null}
    </div>
  )
}
