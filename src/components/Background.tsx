"use client"

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  fetchWallpaperUrl,
  getStoredWallpaperSource,
  type WallpaperSource,
} from '@/features/home/wallpaper'

// 自然轻快的淡入过渡时长（毫秒）
const FADE_TRANSITION_MS = 500

export function Background() {
  // 当前稳定显示的壁纸底图
  const [currentBg, setCurrentBg] = useState<string | null>(null)
  // 正在加载或淡入的新壁纸
  const [nextBg, setNextBg] = useState<string | null>(null)
  // 新壁纸是否已就绪并触发淡入
  const [isNextReady, setIsNextReady] = useState<boolean>(false)

  const currentBgRef = useRef(currentBg)
  const nextBgRef = useRef(nextBg)
  const isTransitioningRef = useRef(false)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    currentBgRef.current = currentBg
  }, [currentBg])

  useEffect(() => {
    nextBgRef.current = nextBg
  }, [nextBg])

  useEffect(() => {
    let isCancelled = false

    const loadWallpaper = async (source: WallpaperSource) => {
      try {
        const url = await fetchWallpaperUrl(source, currentBgRef.current)
        if (isCancelled || !url) return

        // 若与当前或正在准备中的壁纸一致，跳过
        if (url === currentBgRef.current || url === nextBgRef.current) {
          return
        }

        // 放入过渡图层，初始保持 opacity-0，等待图片在浏览器中完全加载就绪后立即淡入
        isTransitioningRef.current = true
        setIsNextReady(false)
        setNextBg(url)
      } catch (e) {
        console.warn(`获取壁纸失败 (${source})，保持深色背景:`, e)
        isTransitioningRef.current = false
      }
    }

    // 初始加载当前源的壁纸
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
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
      }
      window.removeEventListener('wallpaper-source-change', onSourceChange)
      window.removeEventListener('wallpaper-refresh', onRefresh)
    }
  }, [])

  // 新壁纸在浏览器中完成下载与解码（加载完毕）时，立即激活平滑淡入
  const handleNextImageLoad = () => {
    // 双 rAF 确保初始 opacity-0 上帧后无缝激活过渡动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsNextReady(true)

        // 兜底定时器（动画结束原生 onTransitionEnd 会正常清理，若处于后台标签页则由此兜底）
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current)
        }
        fallbackTimeoutRef.current = setTimeout(() => {
          if (nextBgRef.current) {
            setCurrentBg(nextBgRef.current)
            setNextBg(null)
            setIsNextReady(false)
            isTransitioningRef.current = false
          }
        }, FADE_TRANSITION_MS + 60)
      })
    })
  }

  // 加载异常安全清理
  const handleNextImageError = () => {
    setNextBg(null)
    setIsNextReady(false)
    isTransitioningRef.current = false
  }

  // CSS 过渡动画自然结束事件响应
  const handleNextTransitionEnd = (e: React.TransitionEvent<HTMLImageElement>) => {
    if (e.propertyName !== 'opacity') return
    if (nextBg && isNextReady) {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
      }
      setCurrentBg(nextBg)
      setNextBg(null)
      setIsNextReady(false)
      isTransitioningRef.current = false
    }
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
      {/* 基础底图图层（稳定显示层） */}
      {currentBg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentBg}
          alt="Wallpaper"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover select-none will-change-[opacity]"
        />
      )}

      {/* 准备就绪即淡入的过渡新图层：图片加载完毕触发 onLoad 立即淡入，动画结束无缝替换底图 */}
      {nextBg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={nextBg}
          src={nextBg}
          alt="Wallpaper"
          decoding="async"
          onLoad={handleNextImageLoad}
          onError={handleNextImageError}
          onTransitionEnd={handleNextTransitionEnd}
          style={{ transitionDuration: `${FADE_TRANSITION_MS}ms` }}
          className={`absolute inset-0 w-full h-full object-cover select-none will-change-[opacity] transition-opacity ease-out ${
            isNextReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 纯净径向渐变遮罩 */}
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
