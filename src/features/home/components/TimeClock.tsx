'use client'

import { useEffect, useState } from 'react'
import { TimeHeader, TimeHeaderSkeleton } from '@/features/home/components/TimeHeader'
import { useIsMounted } from '@/lib/useIsMounted'

export function TimeClock() {
  const isMounted = useIsMounted()
  const [time, setTime] = useState<Date>(() => new Date())

  useEffect(() => {
    let timerId: number

    // 对齐到整秒边界刷新，避免 setInterval 累积漂移
    const tick = () => {
      const now = new Date()
      setTime(now)
      timerId = window.setTimeout(tick, 1000 - now.getMilliseconds())
    }

    timerId = window.setTimeout(tick, 1000 - new Date().getMilliseconds())

    return () => {
      window.clearTimeout(timerId)
    }
  }, [])

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center">
        <TimeHeaderSkeleton />
      </div>
    )
  }

  // 直接使用浏览器客户端的本地时间
  const hour = String(time.getHours()).padStart(2, '0')
  const minute = String(time.getMinutes()).padStart(2, '0')
  const second = String(time.getSeconds()).padStart(2, '0')

  const dateStr = time.toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div suppressHydrationWarning className="flex flex-col items-center">
      <TimeHeader hour={hour} minute={minute} second={second} dateStr={dateStr} />
    </div>
  )
}
