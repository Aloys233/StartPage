import { NextResponse } from 'next/server'

interface BaiduSugRecResponse {
  g?: Array<{ q: string }>
}

const fetchWithTimeout = async (url: string, headers: Record<string, string>, timeoutMs = 2000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
    })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const engine = (searchParams.get('engine')?.trim() || 'google').toLowerCase()

  if (!q) {
    return NextResponse.json({
      q: '',
      engine,
      items: [],
    })
  }

  // 1. 若配置了后端地址，先尝试从后端获取
  const backendBase = process.env.BACKEND_API_URL || process.env.API_BASE_URL
  if (backendBase) {
    try {
      const backendUrl = `${backendBase.replace(/\/$/, '')}/api/search/suggestions?q=${encodeURIComponent(q)}&engine=${encodeURIComponent(engine)}`
      const res = await fetchWithTimeout(backendUrl, { Accept: 'application/json' }, 1200)
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(data)
      }
    } catch {
      // 后端未运行或超时，继续执行内置聚合逻辑
    }
  }

  // 2. 实时聚合各大搜索引擎公开建议
  const commonHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  }

  try {
    let items: string[] = []

    if (engine === 'baidu') {
      const res = await fetchWithTimeout(
        `https://www.baidu.com/sugrec?prod=pc&wd=${encodeURIComponent(q)}`,
        commonHeaders,
        1500,
      )
      if (res.ok) {
        const data = (await res.json()) as BaiduSugRecResponse
        if (Array.isArray(data.g)) {
          items = data.g.map((item) => item.q).filter(Boolean)
        }
      }
    } else if (engine === 'bing') {
      const res = await fetchWithTimeout(
        `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(q)}`,
        commonHeaders,
        1500,
      )
      if (res.ok) {
        const data = (await res.json()) as [string, string[]]
        if (Array.isArray(data?.[1])) {
          items = data[1]
        }
      }
    } else if (engine === 'duckduckgo') {
      const res = await fetchWithTimeout(
        `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
        commonHeaders,
        1500,
      )
      if (res.ok) {
        const data = (await res.json()) as [string, string[]]
        if (Array.isArray(data?.[1])) {
          items = data[1]
        }
      }
    } else {
      // 默认 Google / YouTube
      const clientType = engine === 'youtube' ? 'youtube' : 'chrome'
      const dsParam = engine === 'youtube' ? '&ds=yt' : ''
      const res = await fetchWithTimeout(
        `https://suggestqueries.google.com/complete/search?client=${clientType}&q=${encodeURIComponent(q)}${dsParam}`,
        commonHeaders,
        1500,
      )
      if (res.ok) {
        const data = (await res.json()) as [string, string[]]
        if (Array.isArray(data?.[1])) {
          items = data[1]
        }
      }
    }

    if (items.length > 0) {
      return NextResponse.json({
        q,
        engine,
        items: items.slice(0, 8),
      })
    }
  } catch {
    // 搜索引擎网络异常，进入本地优雅兜底
  }

  // 3. 兜底回退建议，与后端 SearchService 保持一致
  return NextResponse.json({
    q,
    engine,
    items: [q, `${q} tutorial`, `${q} github`, `${q} docs`],
  })
}
