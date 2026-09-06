"use client"

import type { WheelEvent } from 'react'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Check,
  GripHorizontal,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { ShortcutsIsland } from '@/features/home/islands/ShortcutsIsland'
import { getShortcutIcon } from '@/features/home/shortcuts'
import { secondaryShortcutCategories } from '@/features/home/secondaryShortcuts'
import { buildFaviconUrl, getHostname, openExternalLink } from '@/features/home/url'
import {
  getStoredWallpaperSource,
  setStoredWallpaperSource,
  triggerWallpaperRefresh,
  WALLPAPER_SOURCES,
  type WallpaperSource,
} from '@/features/home/wallpaper'
import { cn } from '@/lib/utils'

type SwipeDirection = 'horizontal' | 'vertical'

const SWIPE_THRESHOLD = 56
const WHEEL_COOLDOWN_MS = 320

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const emptySubscribe = () => () => {}

const subscribeResize = (onStoreChange: () => void) => {
  window.addEventListener('resize', onStoreChange)
  return () => window.removeEventListener('resize', onStoreChange)
}

const getOrientationSnapshot = () =>
  typeof window !== 'undefined' && window.innerWidth >= window.innerHeight ? 'horizontal' : 'vertical'

const getOrientationServerSnapshot = () => 'horizontal' as const

export function SecondaryShortcutDeck() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [activePage, setActivePage] = useState(0)
  const [direction, setDirection] = useState<SwipeDirection>('horizontal')
  const [currentSource, setCurrentSource] = useState<WallpaperSource>(() => getStoredWallpaperSource())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const orientation = useSyncExternalStore(subscribeResize, getOrientationSnapshot, getOrientationServerSnapshot)

  const activeSource = isMounted ? currentSource : 'acg'
  const activeOrientation = isMounted ? orientation : 'horizontal'

  const totalPages = secondaryShortcutCategories.length + 2
  const maxPageIndex = totalPages - 1
  const canPrev = activePage > 0
  const canNext = activePage < maxPageIndex

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const wheelTsRef = useRef(0)

  useEffect(() => {
    const onSourceChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ source?: WallpaperSource }>
      if (customEvent.detail?.source) {
        setCurrentSource(customEvent.detail.source)
      }
    }
    window.addEventListener('wallpaper-source-change', onSourceChange)
    return () => window.removeEventListener('wallpaper-source-change', onSourceChange)
  }, [])

  const pageLabels = useMemo(
    () => ['我的快捷方式', ...secondaryShortcutCategories.map((category) => category.name), '壁纸设置'],
    [],
  )

  const handleSelectSource = (source: WallpaperSource) => {
    setCurrentSource(source)
    setStoredWallpaperSource(source)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    triggerWallpaperRefresh()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  const goToPage = (nextPage: number) => {
    setActivePage(clamp(nextPage, 0, maxPageIndex))
  }

  const goPrev = () => {
    if (!canPrev) {
      return
    }
    goToPage(activePage - 1)
  }

  const goNext = () => {
    if (!canNext) {
      return
    }
    goToPage(activePage + 1)
  }

  const toggleDirection = () => {
    setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'))
  }

  const handleSwipeEnd = (endX: number, endY: number) => {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start) {
      return
    }

    const deltaX = endX - start.x
    const deltaY = endY - start.y

    if (direction === 'horizontal') {
      if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) {
        return
      }
      if (deltaX > 0) {
        goPrev()
      } else {
        goNext()
      }
      return
    }

    if (Math.abs(deltaY) < SWIPE_THRESHOLD || Math.abs(deltaY) < Math.abs(deltaX)) {
      return
    }
    if (deltaY > 0) {
      goPrev()
    } else {
      goNext()
    }
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const now = Date.now()
    if (now - wheelTsRef.current < WHEEL_COOLDOWN_MS) {
      return
    }

    const dominantDelta =
      direction === 'horizontal'
        ? (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY)
        : event.deltaY

    if (Math.abs(dominantDelta) < 26) {
      return
    }

    event.preventDefault()
    wheelTsRef.current = now
    if (dominantDelta > 0) {
      goNext()
    } else {
      goPrev()
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-[0.22em] text-white/72 uppercase">More Shortcuts</h2>
          <p className="text-sm text-white/62">分类整理，支持像手机桌面一样滑动翻页。</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              'cards inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium tracking-[0.08em] transition [--card-hover-scale:1.02]',
              activePage === maxPageIndex
                ? 'border-white/50 bg-white/20 text-white'
                : 'border-white/24 bg-white/8 text-white/90 hover:border-white/45 hover:bg-white/14',
            )}
            onClick={() => goToPage(maxPageIndex)}
            aria-label="Wallpaper settings"
            title="切换壁纸 API 设置"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>壁纸设置</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/24 bg-white/8 px-3.5 py-2 text-xs font-medium tracking-[0.08em] text-white/90 transition hover:border-white/45 hover:bg-white/14"
            onClick={toggleDirection}
            aria-label="Toggle swipe direction"
            title="切换滑动方向"
          >
            <ArrowUpDown className="h-4 w-4" />
            {direction === 'horizontal' ? '左右滑动' : '上下滑动'}
          </button>

          <button
            type="button"
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full border bg-black/35 text-white transition',
              canPrev ? 'border-white/28 hover:border-white/52 hover:bg-black/50' : 'border-white/12 text-white/40',
            )}
            onClick={goPrev}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            {direction === 'horizontal' ? <ArrowLeft className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </button>

          <button
            type="button"
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full border bg-black/35 text-white transition',
              canNext ? 'border-white/28 hover:border-white/52 hover:bg-black/50' : 'border-white/12 text-white/40',
            )}
            onClick={goNext}
            disabled={!canNext}
            aria-label="Next page"
          >
            {direction === 'horizontal' ? <ArrowRight className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="cards rounded-[30px] border border-white/15 p-3 shadow-2xl sm:p-4 [--card-hover-scale:1]">
        <div className="relative h-[66vh] min-h-[460px] max-h-[760px] overflow-hidden rounded-[24px] border border-white/10 bg-black/25">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%), radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.25) 166%)',
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/35 to-transparent" />

          <div
            className={cn(
              'relative h-full w-full select-none',
              direction === 'horizontal' ? 'touch-pan-y' : 'touch-pan-x',
            )}
            onPointerDown={(event) => {
              if (event.button !== 0) {
                return
              }
              pointerStartRef.current = { x: event.clientX, y: event.clientY }
            }}
            onPointerUp={(event) => {
              handleSwipeEnd(event.clientX, event.clientY)
            }}
            onPointerCancel={() => {
              pointerStartRef.current = null
            }}
            onWheel={handleWheel}
          >
            <div
              className={cn(
                'h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                direction === 'horizontal' ? 'flex flex-row' : 'flex flex-col',
              )}
              style={{
                transform:
                  direction === 'horizontal'
                    ? `translate3d(-${activePage * 100}%, 0, 0)`
                    : `translate3d(0, -${activePage * 100}%, 0)`,
              }}
            >
              <section className="h-full w-full shrink-0 overflow-y-auto px-5 pt-5 pb-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
                  <div>
                    <h3 className="text-lg font-semibold tracking-[0.08em] text-white [text-shadow:0_0_8px_rgba(0,0,0,0.5)]">我的快捷方式</h3>
                    <p className="text-sm text-white/60">这里保留你的个人快捷方式，支持编辑和排序。</p>
                  </div>
                  <div className="cards inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] tracking-[0.1em] text-white/80 [--card-hover-scale:1.02]">
                    <GripHorizontal className="h-3.5 w-3.5" />
                    滑动切页
                  </div>
                </div>
                <ShortcutsIsland staticView />
              </section>

              {secondaryShortcutCategories.map((category) => (
                <section key={category.id} className="h-full w-full shrink-0 overflow-y-auto px-5 pt-5 pb-8">
                  <header className="mb-4 px-1">
                    <h3 className="text-lg font-semibold tracking-[0.08em] text-white [text-shadow:0_0_8px_rgba(0,0,0,0.5)]">{category.name}</h3>
                    <p className="text-sm text-white/60">{category.description}</p>
                  </header>

                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
                    {category.items.map((shortcut) => (
                      <button
                        key={`${category.id}:${shortcut.title}`}
                        type="button"
                        className="cards group rounded-2xl border border-white/12 bg-black/25 p-3.5 text-left text-white transition-all duration-300 hover:border-white/30 hover:bg-black/40 active:translate-y-0 [--card-hover-scale:1.02] [--card-active-scale:0.98]"
                        onClick={() => {
                          openExternalLink(shortcut.url)
                        }}
                        title={getHostname(shortcut.url)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-white shadow-sm">
                            {getShortcutIcon(shortcut.title, buildFaviconUrl(shortcut.url))}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-semibold text-white/95">{shortcut.title}</p>
                            <p className="truncate text-xs text-white/55">{getHostname(shortcut.url)}</p>
                            {shortcut.note ? <p className="line-clamp-2 text-xs text-white/60">{shortcut.note}</p> : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}

              {/* 壁纸 API 与外观设置专区 */}
              <section className="h-full w-full shrink-0 overflow-y-auto px-5 pt-5 pb-8">
                <header className="mb-5 flex flex-wrap items-center justify-between gap-3 px-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-300" />
                      <h3 className="text-lg font-semibold tracking-[0.08em] text-white [text-shadow:0_0_8px_rgba(0,0,0,0.5)]">
                        壁纸 API 与外观设置
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-white/60">
                      支持切换微软 Bing 每日精选壁纸及 Aloys API 动漫与风景壁纸。
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                      方向适配: {activeOrientation === 'horizontal' ? '横屏 (horizontal)' : '竖屏 (vertical)'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="cards inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs text-white transition hover:bg-white/20 active:scale-95 [--card-hover-scale:1.05]"
                      title="随机换一张壁纸"
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
                      <span>换一张壁纸</span>
                    </button>
                  </div>
                </header>

                <div className="grid gap-4 sm:grid-cols-3">
                  {WALLPAPER_SOURCES.map((source) => {
                    const isSelected = activeSource === source.id
                    return (
                      <div
                        key={source.id}
                        onClick={() => handleSelectSource(source.id)}
                        className={cn(
                          'cards group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all duration-300 [--card-hover-scale:1.02]',
                          isSelected
                            ? 'border-white/60 bg-white/15 shadow-[0_0_24px_rgba(255,255,255,0.12)]'
                            : 'border-white/10 bg-black/25 hover:border-white/25 hover:bg-black/40',
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide', source.badgeColor)}>
                              {source.tag}
                            </span>
                            {isSelected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/90 text-black">
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </span>
                            )}
                          </div>

                          <h4 className="mt-3 text-base font-semibold text-white/95 group-hover:text-white">
                            {source.name}
                          </h4>
                          <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                            {source.desc}
                          </p>
                        </div>

                        <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/40">
                          {source.id === 'bing'
                            ? '来源: /api/bing (Bing Archive)'
                            : source.id === 'acg'
                              ? '来源: api.aloys23.link/api/v1/image/random/acg'
                              : '来源: api.aloys23.link/api/v1/image/random/scenery'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/65">
                  <p className="font-semibold text-white/85">💡 API 特性与自适应说明：</p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-white/60">
                    <li>
                      <span className="font-medium text-white/80">屏幕方向自适应：</span>
                      当前客户端自动根据视口比例设定 <code className="rounded bg-white/10 px-1 py-0.5 text-white/80">orientation={activeOrientation}</code>，精准获取最符合当前屏幕比例的壁纸。
                    </li>
                    <li>
                      <span className="font-medium text-white/80">直链与 JSON 双模式：</span>
                      API 默认 302 重定向到图片直链，可直接用于博客或外链；追加 <code className="rounded bg-white/10 px-1 py-0.5 text-white/80">?type=json</code> 返回结构化 JSON 数据。
                    </li>
                    <li>
                      <span className="font-medium text-white/80">平滑淡入：</span>
                      切换壁纸或点击“换一张”后，新壁纸在后台预加载解码完成后以 1000ms 电影级平滑交叉淡入呈现。
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Secondary page navigation">
        {pageLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            className={cn(
              'cards rounded-full border px-3.5 py-1.5 text-xs tracking-[0.08em] transition-all duration-300 [--card-hover-scale:1.05]',
              index === activePage
                ? 'border-white/40 bg-white/25 text-white font-semibold shadow-md'
                : 'border-white/12 bg-black/30 text-white/70 hover:border-white/25 hover:text-white',
            )}
            onClick={() => {
              goToPage(index)
            }}
            aria-label={`Go to ${label}`}
          >
            {label}
          </button>
        ))}
      </nav>
    </section>
  )
}
