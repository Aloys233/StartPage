"use client"

import { useEffect, useRef, useState } from 'react'
import {
  fetchWallpaperUrl,
  getStoredWallpaperSource,
  type WallpaperSource,
} from '@/features/home/wallpaper'

export function Background() {
  const [currentBg, setCurrentBg] = useState<string | null>(null)
  const [nextBg, setNextBg] = useState<string | null>(null)
  const [isNextReady, setIsNextReady] = useState<boolean>(false)

  const isTransitioningRef = useRef(false)
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const currentBgRef = useRef(currentBg)

  useEffect(() => {
    currentBgRef.current = currentBg
  }, [currentBg])

  useEffect(() => {
    let isCancelled = false

    const transitionTo = (targetUrl: string) => {
      // 如果目标壁纸与当前壁纸一致，或者当前正在过渡中，直接跳过
      if (!targetUrl || targetUrl === currentBgRef.current || isTransitioningRef.current) {
        return
      }

      isTransitioningRef.current = true

      const img = new Image()
      img.src = targetUrl

      const handleImageLoaded = () => {
        if (isCancelled) return

        // 1. 将新图放入 DOM，初始保持 opacity-0
        setNextBg(targetUrl)
        setIsNextReady(false)

        // 2. 双 rAF 确保浏览器将 opacity-0 渲染入 DOM 帧，随后激活 transition 平滑淡入
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = requestAnimationFrame(() => {
            if (isCancelled) return
            setIsNextReady(true)

            // 3. 等待 1000ms 过渡动画完全结束后，将底图替换为新图并清理过渡图层
            animTimeoutRef.current = setTimeout(() => {
              if (isCancelled) return
              setCurrentBg(targetUrl)
              setNextBg(null)
              setIsNextReady(false)
              isTransitioningRef.current = false
            }, 1050)
          })
        })
      }

      if (img.complete) {
        handleImageLoaded()
      } else {
        img.onload = handleImageLoaded
        img.onerror = () => {
          isTransitioningRef.current = false
        }
      }
    }

    const loadWallpaper = async (source: WallpaperSource) => {
      try {
        const url = await fetchWallpaperUrl(source)
        if (isCancelled || !url) return
        transitionTo(url)
      } catch (e) {
        console.warn(`获取壁纸失败 (${source})，保持深色背景:`, e)
      }
    }

    // 初始异步拉取当前源的壁纸
    const initialSource = getStoredWallpaperSource()
    void loadWallpaper(initialSource)

    // 监听壁纸源变更与刷新通知
    const onSourceChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ source?: WallpaperSource }>
      const newSource = customEvent.detail?.source || 'acg'
      void loadWallpaper(newSource)
    }

    const onRefresh = () => {
      const current = getStoredWallpaperSource()
      void loadWallpaper(current)
    }

    window.addEventListener('wallpaper-source-change', onSourceChange)
    window.addEventListener('wallpaper-refresh', onRefresh)

    return () => {
      isCancelled = true
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      window.removeEventListener('wallpaper-source-change', onSourceChange)
      window.removeEventListener('wallpaper-refresh', onRefresh)
    }
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
      {/* 基础底图图层（淡入完成后的稳定显示层） */}
      {currentBg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentBg}
          alt="Wallpaper"
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
      )}

      {/* 渐入过渡新图层（首先无壁纸，加载就绪后 1000ms 丝滑淡入） */}
      {nextBg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={nextBg}
          alt="Wallpaper"
          className={`absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-1000 ease-in-out ${
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
