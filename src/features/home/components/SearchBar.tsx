"use client"

import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { getSessionSnapshot, subscribeSession } from '@/api/client'
import { getMySettings, updateMySettings } from '@/api/settings'
import { getSuggestions } from '@/api/suggestions'
import { cn } from '@/lib/utils'
import { useIsMounted } from '@/lib/useIsMounted'
import { engines, FALLBACK_ENGINES, MAX_SEARCH_HISTORY } from '@/features/home/constants'
import { SearchEngineSelect } from '@/features/home/components/SearchEngineSelect'
import { SuggestionsPanel } from '@/features/home/components/SuggestionsPanel'
import { escapeRegExp, isTypingTarget } from '@/features/home/shortcuts'
import { loadSearchHistory, loadStoredEngine, saveSearchHistory, saveStoredEngine } from '@/features/home/storage'
import { setSearchUiState } from '@/features/home/searchUiState'
import type { SearchEngine, SuggestionStatus } from '@/features/home/types'
import { openExternalLink } from '@/features/home/url'

export function SearchBar() {
  const isMounted = useIsMounted()
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
  // 供 portal 目标使用的宿主元素：必须走 state，渲染期读 ref.current 拿不到值也不会触发重渲染
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)
  // 云端偏好是否已拉取完成：完成前不回写，避免用本地值覆盖服务端设置
  const remoteSettingsLoadedRef = useRef(false)
  // 用户是否手动切换过引擎：切换后不再被迟到的云端响应覆盖
  const engineTouchedRef = useRef(false)

  const attachContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    setPortalContainer(node)
  }, [])

  const activeEngine = isMounted ? engine : engines[0]

  const filteredRecentSearches = useMemo(() => {
    if (!isMounted) {
      return []
    }

    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return recentSearches.slice(0, 4)
    }

    return recentSearches
      .filter((item) => item.toLowerCase().includes(keyword))
      .slice(0, 4)
  }, [isMounted, query, recentSearches])

  useEffect(() => {
    const unsubscribe = subscribeSession((snapshot) => {
      setIsAuthenticated(Boolean(snapshot.user))
    })

    return unsubscribe
  }, [])

  // 登录后先拉取云端偏好并应用，否则每次进页面都会用本地值把服务端设置覆盖掉
  useEffect(() => {
    if (!isAuthenticated) {
      remoteSettingsLoadedRef.current = false
      return
    }

    let cancelled = false

    void getMySettings()
      .then((settings) => {
        if (cancelled) {
          return
        }
        const remoteEngine = engines.find((item) => item.id === settings.defaultEngine)
        // 用户已在响应返回前手动选过引擎时，以用户选择为准
        if (remoteEngine && !engineTouchedRef.current) {
          setEngine(remoteEngine)
        }
      })
      .catch(() => {
        // 拉取失败时继续用本地引擎，并允许后续把本地选择同步上去
      })
      .finally(() => {
        if (!cancelled) {
          remoteSettingsLoadedRef.current = true
        }
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    saveStoredEngine(engine.id)

    // 云端偏好拉取完成前不回写，避免覆盖服务端设置
    if (!isAuthenticated || !remoteSettingsLoadedRef.current) {
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
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return
      }

      if (event.key === 'Escape' && showEngineMenu) {
        setShowEngineMenu(false)
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
  }, [query, showEngineMenu])

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
    // Enter / Escape 必须无条件响应：候选面板有 180ms 防抖，
    // 不能因为面板尚未展开就把回车吞掉。
    if (event.key === 'Enter') {
      event.preventDefault()

      if (showSuggestions && selectedIdx >= 0) {
        if (suggestions.length > 0) {
          handleSearch(suggestions[selectedIdx])
        } else if (selectedIdx < filteredRecentSearches.length) {
          handleSearch(filteredRecentSearches[selectedIdx])
        } else {
          const fallbackEngine = FALLBACK_ENGINES[selectedIdx - filteredRecentSearches.length]
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
      return
    }

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
      {/*
       * 搜索聚焦时的全屏周围纯模糊遮罩：纯高斯模糊虚化背景，绝无黑色遮罩背景压暗。
       * 只在需要时挂载 —— 与二级页面遮罩同理，关闭后必须卸载，
       * 否则 opacity:0 的图层会留下陈旧的 backdrop 快照（表现为页面上残留一块模糊）。
       */}
      {(focused || showSuggestions || showEngineMenu) && (
        <div
          className="overlay-blur-mask pointer-events-none fixed inset-0 z-20 backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]"
          aria-hidden="true"
        />
      )}

      {/* 搜索岛外层定位容器 */}
      <div
        ref={attachContainer}
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
            'cards absolute top-0 right-0 left-0 z-40 w-full rounded-[30px] border border-white/15 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow,background-color] duration-300 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [--card-hover-scale:1] [--card-active-scale:1]',
            hasSuggestions && 'shadow-[0_24px_60px_rgba(0,0,0,0.5)]',
          )}
        >
          <div className="flex items-stretch gap-3 p-1.5">
            <SearchEngineSelect
              engine={activeEngine}
              engines={engines}
              showEngineMenu={showEngineMenu}
              portalContainer={portalContainer}
              onToggle={() => {
                setShowEngineMenu((prev) => {
                  const next = !prev
                  if (next) {
                    setShowSuggestions(false)
                  }
                  return next
                })
              }}
              onSelect={(item) => {
                engineTouchedRef.current = true
                setEngine(item)
                setShowEngineMenu(false)
              }}
            />

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => {
                setShowEngineMenu(false)
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
              placeholder={`Search with ${activeEngine.name}...`}
              className="h-14 flex-1 border-none bg-transparent px-4 py-3 text-xl leading-none text-white tracking-wide outline-none placeholder:font-light placeholder:text-white/28 shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
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
              className="group/search flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-white/95 text-black shadow-xl transition-all duration-300 hover:scale-110 hover:bg-white active:scale-90 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
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
