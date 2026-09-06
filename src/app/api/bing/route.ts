import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idx = searchParams.get('idx') || '0'

    const bingApiUrl = `https://cn.bing.com/HPImageArchive.aspx?format=js&idx=${encodeURIComponent(
      idx,
    )}&n=1&mkt=zh-CN`

    const res = await fetch(bingApiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      throw new Error(`Bing API responded with status ${res.status}`)
    }

    const data = await res.json()
    const imageInfo = data?.images?.[0]

    if (!imageInfo || !imageInfo.url) {
      throw new Error('Invalid Bing API response structure')
    }

    const fullUrl = imageInfo.url.startsWith('http')
      ? imageInfo.url
      : `https://cn.bing.com${imageInfo.url}`

    return NextResponse.json({
      code: 200,
      url: fullUrl,
      title: imageInfo.title || '每日一图',
      copyright: imageInfo.copyright || '',
    })
  } catch (error) {
    console.error('Failed to fetch Bing daily wallpaper:', error)
    return NextResponse.json(
      {
        code: 500,
        message: 'Failed to fetch Bing wallpaper',
        url: '/images/background1.jpg',
      },
      { status: 500 },
    )
  }
}
