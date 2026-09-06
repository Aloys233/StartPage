"use client"

import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { getSessionSnapshot, subscribeSession } from '@/api/auth'
import { updateMySettings } from '@/api/settings'
import { getSuggestions } from '@/api/suggestions'
import { cn } from '@/lib/utils'
import { engines, FALLBACK_ENGINES, MAX_SEARCH_HISTORY } from '@/features/home/constants'
import { SearchEngineSelect } from '@/features/home/components/SearchEngineSelect'
import { SuggestionsPanel } from '@/features/home/components/SuggestionsPanel'
import { escapeRegExp, isTypingTarget } from '@/features/home/shortcuts'
import { loadSearchHistory, loadStoredEngine, saveSearchHistory, saveStoredEngine } from '@/features/home/storage'
import { setSearchUiState } from '@/features/home/searchUiState'
import type { SearchEngine, SuggestionStatus } from '@/features/home/types'
import { openExternalLink } from '@/features/home/url'
import { LogtoAuth } from '@/components/LogtoAuth'

export function SearchIsland() {
  return (
    <LogtoAuth>
      <SearchContent />
    </LogtoAuth>
  )
}

function SearchContent() {
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState<SearchEngine>(() => loadStoredEngine())
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getSessionSnapshot().user))
  const [showEngineMenu, setShowEngineMenu] = useState(false)
  const [focused, setFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>('idle')
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadSearchHistory())
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimeoutRef = useRef<number | null>(null)
  const suggestionRequestRef = useRef(0)
  const suggestionCacheRef = useRef<Map<string, string[]>>(new Map())
  const suggestionListId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredRecentSearches = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return recentSearches.slice(0, 4)
    }

    return recentSearches
      .filter((item) => item.toLowerCase().includes(keyword))
      .slice(0, 4)
  }, [query, recentSearches])

  useEffect(() => {
    const unsubscribe = subscribeSession((snapshot) => {
      setIsAuthenticated(Boolean(snapshot.user))
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    saveStoredEngine(engine.id)

    if (!isAuthenticated) {
      return
    }

    void updateMySettings({ defaultEngine: engine.id }).catch(() => {
      // Ignore when remote sync fails.
    })
  }, [engine.id, isAuthenticated])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    saveSearchHistory(recentSearches)
  }, [recentSearches])

  useEffect(() => {
    const onDefaultEngineSync = (event: Event) => {
      const detail = (event as CustomEvent<{ engineId?: string }>).detail
      const engineId = detail?.engineId
      if (!engineId) {
        return
      }

      const remoteEngine = engines.find((item) => item.id === engineId)
      if (remoteEngine) {
        setEngine(remoteEngine)
      }
    }

    window.addEventListener('home:default-engine-sync', onDefaultEngineSync)
    return () => {
      window.removeEventListener('home:default-engine-sync', onDefaultEngineSync)
    }
  }, [])

  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return
      }

      const isFocusShortcut =
        event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')

      if (!isFocusShortcut) {
        return
      }

      event.preventDefault()
      inputRef.current?.focus()
      setFocused(true)
      if (query.trim()) {
        setShowSuggestions(true)
      }
    }

    window.addEventListener('keydown', onGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', onGlobalKeyDown)
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [query])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return
      }

      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current)
        blurTimeoutRef.current = null
      }

      inputRef.current?.blur()
      setFocused(false)
      setShowSuggestions(false)
      setSelectedIdx(-1)
      setShowEngineMenu(false)
    }

    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  useEffect(() => {
    const text = query.trim()

    if (!text) {
      suggestionRequestRef.current += 1
      queueMicrotask(() => {
        setSuggestions([])
        setSuggestionStatus('idle')
        setShowSuggestions(false)
        setSelectedIdx(-1)
      })
      return
    }

    const requestId = suggestionRequestRef.current + 1
    suggestionRequestRef.current = requestId
    const cacheKey = `${engine.id}:${text.toLowerCase()}`
    const cached = suggestionCacheRef.current.get(cacheKey)

    if (cached) {
      queueMicrotask(() => {
        setSuggestions(cached)
        setSuggestionStatus('ready')
        setShowSuggestions(true)
        setSelectedIdx(-1)
      })
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setSuggestionStatus('loading')
      const result = await getSuggestions(text, engine.id)

      if (suggestionRequestRef.current !== requestId) {
        return
      }

      suggestionCacheRef.current.set(cacheKey, result)
      setSuggestions(result)
      setSuggestionStatus('ready')
      setShowSuggestions(true)
      setSelectedIdx(-1)
    }, 180)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [engine.id, query])

  useEffect(() => {
    setSearchUiState({ query, showSuggestions })
  }, [query, showSuggestions])

  useEffect(() => {
    return () => {
      setSearchUiState({ query: '', showSuggestions: false })
    }
  }, [])

  const pushSearchHistory = (term: string) => {
    setRecentSearches((prev) => {
      const normalized = term.trim()
      if (!normalized) {
        return prev
      }

      const next = [normalized, ...prev.filter((item) => item !== normalized)]
      return next.slice(0, MAX_SEARCH_HISTORY)
    })
  }

  const handleSearch = (q: string = query, e: SearchEngine = engine) => {
    const text = q.trim()
    if (!text) return

    pushSearchHistory(text)
    openExternalLink(`${e.url}${encodeURIComponent(text)}`)
    setShowSuggestions(false)
    setSelectedIdx(-1)
  }

  const onKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return

    const maxIdx =
      suggestions.length > 0
        ? suggestions.length - 1
        : filteredRecentSearches.length + FALLBACK_ENGINES.length - 1

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIdx((prev) => Math.min(prev + 1, maxIdx))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIdx((prev) => Math.max(prev - 1, -1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      if (selectedIdx >= 0) {
        if (suggestions.length > 0) {
          handleSearch(suggestions[selectedIdx])
        } else if (selectedIdx < filteredRecentSearches.length) {
          handleSearch(filteredRecentSearches[selectedIdx])
        } else {
          const fallbackIdx = selectedIdx - filteredRecentSearches.length
          const fallbackEngine = FALLBACK_ENGINES[fallbackIdx]
          if (fallbackEngine) {
            handleSearch(query, fallbackEngine)
          }
        }
      } else {
        handleSearch()
      }
      return
    }

    if (event.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIdx(-1)
    }
  }

  const highlight = (text: string): string | ReactNode[] => {
    const q = query.trim()
    if (!q) return text

    const escapedQuery = escapeRegExp(q)
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))

    return parts.map((part, index) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <b key={`${part}-${index}`} className="font-bold text-white">
          {part}
        </b>
      ) : (
        part
      ),
    )
  }

  const hasSuggestions = showSuggestions && query.trim().length > 0

  return (
    <>
      {/* 搜索聚焦时的全屏周围纯模糊遮罩：纯高斯模糊虚化背景，绝无黑色遮罩背景压暗 */}
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-20 transition-[opacity,backdrop-filter] duration-300 ease-out',
          focused || showSuggestions
            ? 'opacity-100 backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]'
            : 'opacity-0 backdrop-blur-none [-webkit-backdrop-filter:none]',
        )}
        aria-hidden="true"
      />

      {/* 搜索岛外层定位容器 */}
      <div
        ref={containerRef}
        suppressHydrationWarning
        className="relative z-30 mb-[6vh] w-full max-w-[760px]"
      >
        {/* 永久占位容器：确保常规文档流几何尺寸恒定，打字展开时下方组件绝不发生位移跳动 */}
        <div
          className="invisible pointer-events-none select-none border border-transparent p-2"
          aria-hidden="true"
        >
          <div className="flex items-stretch gap-3 p-1.5">
            <div className="h-14 w-[176px] shrink-0" />
            <div className="h-14 flex-1" />
            <div className="h-14 w-14 shrink-0" />
          </div>
          <div className="px-5 pb-1 text-[11px] leading-normal">
            按 <kbd className="rounded px-1.5 py-0.5">/</kbd> 或
            <kbd className="ml-1 rounded px-1.5 py-0.5">Ctrl/Cmd + K</kbd> 快速聚焦搜索框
          </div>
        </div>

        {/* 真实一体化毛玻璃卡片：始终绝对定位于顶部，输入文字时向下流体式平滑展开 */}
        <div
          className={cn(
            'cards absolute top-0 right-0 left-0 z-40 w-full rounded-[30px] border border-white/15 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow,background-color] duration-300 [--card-hover-scale:1] [--card-active-scale:1]',
            focused && 'border-white/35 shadow-[0_16px_48px_rgba(0,0,0,0.3)]',
            hasSuggestions && 'shadow-[0_24px_60px_rgba(0,0,0,0.5)]',
          )}
        >
          <div className="flex items-stretch gap-3 p-1.5">
            <SearchEngineSelect
              engine={engine}
              engines={engines}
              showEngineMenu={showEngineMenu}
              onToggle={() => setShowEngineMenu((prev) => !prev)}
              onSelect={(item) => {
                setEngine(item)
                setShowEngineMenu(false)
              }}
            />

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => {
                if (blurTimeoutRef.current !== null) {
                  window.clearTimeout(blurTimeoutRef.current)
                  blurTimeoutRef.current = null
                }
                setFocused(true)
                if (query.trim()) {
                  setShowSuggestions(true)
                }
              }}
              onBlur={() => {
                blurTimeoutRef.current = window.setTimeout(() => {
                  setFocused(false)
                  blurTimeoutRef.current = null
                }, 160)
              }}
              onKeyDown={onKey}
              placeholder={`Search with ${engine.name}...`}
              className="h-14 flex-1 border-none bg-transparent px-4 py-3 text-xl leading-none text-white tracking-wide outline-none placeholder:font-light placeholder:text-white/28"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={hasSuggestions}
              aria-controls={suggestionListId}
              aria-activedescendant={
                selectedIdx >= 0
                  ? suggestions.length > 0
                    ? `${suggestionListId}-suggestion-${selectedIdx}`
                    : selectedIdx < filteredRecentSearches.length
                      ? `${suggestionListId}-history-${selectedIdx}`
                      : `${suggestionListId}-engine-${selectedIdx - filteredRecentSearches.length}`
                  : undefined
              }
            />

            <button
              type="button"
              className="group/search flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-white/95 text-black shadow-xl transition-all duration-300 hover:scale-110 hover:bg-white active:scale-90"
              onClick={() => handleSearch()}
              aria-label="Search"
            >
              <Search className="h-[22px] w-[22px] stroke-[2.5] transition-transform duration-300 group-hover/search:scale-110" />
            </button>
          </div>

          <div className="px-5 pb-1 text-[11px] tracking-[0.08em] text-white/40">
            按 <kbd className="rounded bg-white/15 px-1.5 py-0.5">/</kbd> 或
            <kbd className="ml-1 rounded bg-white/15 px-1.5 py-0.5">Ctrl/Cmd + K</kbd> 快速聚焦搜索框
          </div>

          {/* 候选建议展开容器：常驻 DOM，由 CSS Grid 控制 0fr 到 1fr 的平滑高度展开与收折动画 */}
          <div className={cn('search-expand-wrapper', hasSuggestions && 'is-expanded')}>
            <div className="search-expand-inner">
              <SuggestionsPanel
                showSuggestions={hasSuggestions}
                query={query}
                suggestionListId={suggestionListId}
                suggestionStatus={suggestionStatus}
                suggestions={suggestions}
                selectedIdx={selectedIdx}
                setSelectedIdx={setSelectedIdx}
                filteredRecentSearches={filteredRecentSearches}
                fallbackEngines={FALLBACK_ENGINES}
                onSearch={handleSearch}
                highlight={highlight}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
