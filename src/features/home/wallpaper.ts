export type WallpaperSource = 'bing' | 'acg' | 'scenery'

export const WALLPAPER_SOURCE_KEY = 'startpage_wallpaper_source'
export const WALLPAPER_PREFETCH_KEY_PREFIX = 'startpage_next_wallpaper_'

export interface WallpaperSourceOption {
  id: WallpaperSource
  name: string
  desc: string
  tag: string
  badgeColor: string
}

export const WALLPAPER_SOURCES: WallpaperSourceOption[] = [
  {
    id: 'bing',
    name: 'Bing 每日壁纸',
    desc: '微软必应每日高清精选壁纸，自然地理与人文风光',
    tag: '每日一图',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'acg',
    name: '二次元动漫壁纸',
    desc: '高质量二次元与动漫精美插画，支持横竖屏精准适配',
    tag: '随机动漫',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  {
    id: 'scenery',
    name: '自然风景壁纸',
    desc: '山川湖海、浩瀚星空与秀美景色，随心换新',
    tag: '随机风景',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
]

export const getScreenOrientation = (): 'horizontal' | 'vertical' => {
  if (typeof window === 'undefined') return 'horizontal'
  return window.innerWidth >= window.innerHeight ? 'horizontal' : 'vertical'
}

export const getStoredWallpaperSource = (): WallpaperSource => {
  if (typeof window === 'undefined') return 'acg'
  try {
    const val = localStorage.getItem(WALLPAPER_SOURCE_KEY)
    if (val === 'bing' || val === 'acg' || val === 'scenery') {
      return val
    }
  } catch {
    // Ignore storage read error
  }
  return 'acg'
}

export const setStoredWallpaperSource = (source: WallpaperSource) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(WALLPAPER_SOURCE_KEY, source)
    window.dispatchEvent(new CustomEvent('wallpaper-source-change', { detail: { source } }))
  } catch {
    // Ignore storage write error
  }
}

export const triggerWallpaperRefresh = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('wallpaper-refresh'))
}

interface StoredPrefetchedItem {
  url: string
  source: WallpaperSource
  orientation: 'horizontal' | 'vertical'
  timestamp: number
}

// 读取指定源在 localStorage 中预先准备好的下一张壁纸地址
export function getStoredPrefetchedWallpaper(source: WallpaperSource): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${WALLPAPER_PREFETCH_KEY_PREFIX}${source}`)
    if (!raw) return null
    const data: StoredPrefetchedItem = JSON.parse(raw)
    const currentOrientation = getScreenOrientation()

    // 屏幕横竖屏旋转后丢弃不匹配比例的预存，重新拉取
    if (data.orientation && data.orientation !== currentOrientation) {
      return null
    }

    // 超过 7 天视作过期
    if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${WALLPAPER_PREFETCH_KEY_PREFIX}${source}`)
      return null
    }

    return data.url || null
  } catch {
    return null
  }
}

// 消费并清除指定源的预存下一张壁纸
export function consumeStoredPrefetchedWallpaper(source: WallpaperSource): string | null {
  if (typeof window === 'undefined') return null
  const url = getStoredPrefetchedWallpaper(source)
  try {
    localStorage.removeItem(`${WALLPAPER_PREFETCH_KEY_PREFIX}${source}`)
  } catch {
    // ignore
  }
  return url
}

// 保存预下载完成的下一张壁纸到 localStorage
export function saveStoredPrefetchedWallpaper(
  source: WallpaperSource,
  url: string,
  orientation: 'horizontal' | 'vertical',
): void {
  if (typeof window === 'undefined' || !url) return
  try {
    const data: StoredPrefetchedItem = {
      url,
      source,
      orientation,
      timestamp: Date.now(),
    }
    localStorage.setItem(`${WALLPAPER_PREFETCH_KEY_PREFIX}${source}`, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save prefetched wallpaper to localStorage', e)
  }
}

// 核心预下载：使用 new Image() 在后台完整下载图片到浏览器本地缓存
export function preloadImageResource(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !url) {
      resolve(false)
      return
    }
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
    if (img.complete) {
      resolve(true)
    }
  })
}

// 从 API 获取真实图片直链
export async function fetchRawWallpaperUrl(
  source: WallpaperSource,
  orientation: 'horizontal' | 'vertical' = getScreenOrientation(),
): Promise<string | null> {
  try {
    if (source === 'acg') {
      const res = await fetch(
        `https://api.aloys23.link/api/v1/image/random/acg?type=json&orientation=${orientation}`,
      )
      if (!res.ok) throw new Error(`ACG wallpaper request failed: ${res.status}`)
      const data = await res.json()
      return data.url || null
    }

    if (source === 'scenery') {
      const res = await fetch(
        `https://api.aloys23.link/api/v1/image/random/scenery?type=json&orientation=${orientation}`,
      )
      if (!res.ok) throw new Error(`Scenery wallpaper request failed: ${res.status}`)
      const data = await res.json()
      return data.url || null
    }

    // 默认 bing：走服务端代理避开跨域
    const res = await fetch('/api/bing')
    if (!res.ok) throw new Error(`Bing wallpaper request failed: ${res.status}`)
    const data = await res.json()
    return data.url || null
  } catch (error) {
    console.warn(`[Wallpaper] 拉取原始壁纸失败 (${source}):`, error)
    return null
  }
}

// 全局前台在途请求锁：彻底杜绝 React StrictMode 或多次渲染导致的重复前台请求
let inFlightFetchPromise: Promise<string | null> | null = null
let inFlightFetchKey: string | null = null

// 全局后台预加载锁与延时定时器
let inFlightPrefetchPromise: Promise<string | null> | null = null
let inFlightPrefetchKey: string | null = null
let prefetchTimer: ReturnType<typeof setTimeout> | null = null

// 延时调度后台预拉取，避开首屏竞争
export function schedulePrefetch(source: WallpaperSource, excludeUrl?: string | null): void {
  if (typeof window === 'undefined') return

  if (prefetchTimer) {
    clearTimeout(prefetchTimer)
  }

  prefetchTimer = setTimeout(() => {
    void prefetchNextWallpaper(source, excludeUrl)
  }, 800)
}

// 后台静默预加载下一张壁纸：拉取新直链 -> 浏览器预下载完成 -> 存入 localStorage
export async function prefetchNextWallpaper(
  source: WallpaperSource,
  excludeUrl?: string | null,
): Promise<string | null> {
  if (typeof window === 'undefined') return null

  // 若当前已有缓存且未被消费，不再发送多余请求
  const existing = getStoredPrefetchedWallpaper(source)
  if (existing && existing !== excludeUrl) {
    return existing
  }

  const orientation = getScreenOrientation()
  const prefetchKey = `${source}_${orientation}`

  if (inFlightPrefetchPromise && inFlightPrefetchKey === prefetchKey) {
    return inFlightPrefetchPromise
  }

  inFlightPrefetchKey = prefetchKey
  inFlightPrefetchPromise = (async (): Promise<string | null> => {
    try {
      const nextUrl = await fetchRawWallpaperUrl(source, orientation)
      if (!nextUrl || (excludeUrl && nextUrl === excludeUrl)) {
        return null
      }

      // 静默下载图片，落入浏览器 HTTP 缓存
      const loaded = await preloadImageResource(nextUrl)
      if (!loaded) {
        return null
      }

      // 图片下载完全成功后，存入 localStorage 作为下一次刷新备用
      saveStoredPrefetchedWallpaper(source, nextUrl, orientation)
      return nextUrl
    } catch (error) {
      console.warn(`[Prefetch] 预加载下一张壁纸出错 (${source}):`, error)
      return null
    } finally {
      inFlightPrefetchPromise = null
      inFlightPrefetchKey = null
    }
  })()

  return inFlightPrefetchPromise
}

// 获取下一张壁纸：优先命中已预下载完成的壁纸（秒开）；并在后台延后无感补充下下张
export async function getNextWallpaperUrl(
  source: WallpaperSource,
  currentUrl?: string | null,
): Promise<string | null> {
  const orientation = getScreenOrientation()
  const fetchKey = `${source}_${orientation}`

  // 全局防重锁：同一时刻无论多少次并发挂载，都严格只执行一次解析
  if (inFlightFetchPromise && inFlightFetchKey === fetchKey) {
    return inFlightFetchPromise
  }

  inFlightFetchKey = fetchKey
  inFlightFetchPromise = (async () => {
    try {
      // 1. 优先尝试消费已存入 localStorage 的已预下载壁纸
      const prefetchedUrl = consumeStoredPrefetchedWallpaper(source)

      if (prefetchedUrl && prefetchedUrl !== currentUrl) {
        // 命中预下载缓存（0 次 API 网络请求）！后台延后调度新一轮预下载备用
        schedulePrefetch(source, prefetchedUrl)
        return prefetchedUrl
      }

      // 2. 若当前无预存壁纸（如首次冷启动），发起仅有 1 次的实时请求
      const rawUrl = await fetchRawWallpaperUrl(source, orientation)
      if (rawUrl) {
        // 当前壁纸成功呈现后，后台延后调度拉取下一次刷新所需壁纸
        schedulePrefetch(source, rawUrl)
      }
      return rawUrl
    } finally {
      inFlightFetchPromise = null
      inFlightFetchKey = null
    }
  })()

  return inFlightFetchPromise
}

// 向下兼容现有 Background.tsx 的调用接口
export async function fetchWallpaperUrl(
  source: WallpaperSource,
  currentUrl?: string | null,
): Promise<string | null> {
  return getNextWallpaperUrl(source, currentUrl)
}
