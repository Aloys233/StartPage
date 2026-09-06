"use client"

import { useEffect, useRef, useState } from 'react'

export function Background() {
  const [currentBg, setCurrentBg] = useState<string>('/images/background1.jpg')
  const [nextBg, setNextBg] = useState<string>('')
  const [isNextReady, setIsNextReady] = useState<boolean>(false)
  const isMountedRef = useRef(false)

  useEffect(() => {
    if (isMountedRef.current) return
    isMountedRef.current = true

    // 随机一张本地壁纸作为即时底图
    const randomLocalIdx = Math.floor(Math.random() * 10) + 1
    const initialLocal = `/images/background${randomLocalIdx}.jpg`
    setCurrentBg(initialLocal)

    // 异步拉取 Bing 高清壁纸并进行电影级平滑交叉淡入
    const fetchBing = async () => {
      try {
        const res = await fetch(`/api/bing?_t=${Date.now()}`)
        if (!res.ok) return
        const data = await res.json()
        if (!data?.url) return

        const targetUrl = data.url
        const img = new Image()
        img.src = targetUrl

        const onReady = () => {
          setNextBg(targetUrl)
          setIsNextReady(true)

          setTimeout(() => {
            setCurrentBg(targetUrl)
            setNextBg('')
            setIsNextReady(false)
          }, 800)
        }

        if (img.complete) {
          onReady()
        } else {
          img.onload = onReady
        }
      } catch (e) {
        console.warn('获取 Bing 壁纸失败，保持精美本地壁纸:', e)
      }
    }

    void fetchBing()
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
      {/* 基础底图图层 */}
      {currentBg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentBg}
          alt="Wallpaper"
          className="absolute inset-0 w-full h-full object-cover select-none transition-all duration-700 opacity-100"
        />
      )}

      {/* 渐入过渡新图层（电影级平滑交叉淡入） */}
      {nextBg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={nextBg}
          alt="Wallpaper"
          className={`absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-800 ease-in-out ${
            isNextReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 纯净径向渐变遮罩 (复刻 home 标准透光率，让卡片 backdrop-filter 清晰透出毛玻璃质感) */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.45) 100%), radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.25) 166%)',
        }}
      />
    </div>
  )
}
