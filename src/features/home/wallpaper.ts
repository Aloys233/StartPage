export type WallpaperSource = 'bing' | 'acg' | 'scenery'

export const WALLPAPER_SOURCE_KEY = 'startpage_wallpaper_source'

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

let inFlightPromise: Promise<string | null> | null = null
let inFlightSource: WallpaperSource | null = null

export async function fetchWallpaperUrl(source: WallpaperSource): Promise<string | null> {
  // 若当前同源请求正在进行中，直接复用，防止React严格模式或并发导致重复请求两次
  if (inFlightPromise && inFlightSource === source) {
    return inFlightPromise
  }

  const orientation = getScreenOrientation()
  inFlightSource = source

  const fetcher = async (): Promise<string | null> => {
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
    } finally {
      inFlightPromise = null
      inFlightSource = null
    }
  }

  inFlightPromise = fetcher()
  return inFlightPromise
}
