import type { SearchEngineId } from '@/features/home/types'

function jsonp<T>(url: string, callbackParam = 'cb', timeoutMs = 2000): Promise<T> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not defined'))
  }

  return new Promise((resolve, reject) => {
    const callbackName = `__jsonp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    let isCleaned = false

    const cleanup = () => {
      if (isCleaned) return
      isCleaned = true
      delete (window as unknown as Record<string, unknown>)[callbackName]
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('JSONP timeout'))
    }, timeoutMs)

    ;(window as unknown as Record<string, unknown>)[callbackName] = (data: T) => {
      cleanup()
      resolve(data)
    }

    const script = document.createElement('script')
    const delimiter = url.includes('?') ? '&' : '?'
    script.src = `${url}${delimiter}${callbackParam}=${callbackName}`
    script.onerror = () => {
      cleanup()
      reject(new Error('JSONP load error'))
    }

    document.head.appendChild(script)
  })
}

export async function getSuggestions(query: string, engineId: SearchEngineId = 'google'): Promise<string[]> {
  const q = query.trim()
  if (!q) return []

  try {
    if (engineId === 'baidu') {
      interface BaiduResponse {
        s?: string[]
      }
      const data = await jsonp<BaiduResponse>(
        `https://suggestion.baidu.com/su?wd=${encodeURIComponent(q)}&p=3`,
        'cb',
      )
      if (Array.isArray(data?.s) && data.s.length > 0) {
        return data.s.slice(0, 8)
      }
    } else if (engineId === 'bing') {
      type BingResponse = [string, string[]]
      const data = await jsonp<BingResponse>(
        `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(q)}&JsonType=callback`,
        'JsonCallback',
      )
      if (Array.isArray(data?.[1]) && data[1].length > 0) {
        return data[1].slice(0, 8)
      }
    } else {
      // 谷歌 / YouTube 等使用 Google Complete Suggest (JSONP)
      type GoogleResponse = [string, Array<[string, number, ...number[]] | string>]
      const client = engineId === 'youtube' ? 'youtube' : 'chrome'
      const ds = engineId === 'youtube' ? '&ds=yt' : ''
      const data = await jsonp<GoogleResponse>(
        `https://suggestqueries.google.com/complete/search?client=${client}&q=${encodeURIComponent(q)}${ds}`,
        'jsonp',
      )
      if (Array.isArray(data?.[1]) && data[1].length > 0) {
        const items = data[1]
          .map((item) => (Array.isArray(item) ? item[0] : item))
          .filter(Boolean)
        if (items.length > 0) {
          return items.slice(0, 8)
        }
      }
    }
  } catch (error) {
    console.debug(`客户端直接请求搜索建议失败 (${engineId}):`, error)
  }

  // 兜底回退建议
  return [q, `${q} tutorial`, `${q} github`, `${q} docs`]
}
