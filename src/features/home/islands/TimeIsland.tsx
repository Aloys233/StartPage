"use client"

import { useEffect, useState, useSyncExternalStore } from 'react'
import { TimeHeader, TimeHeaderSkeleton } from '@/features/home/components/TimeHeader'

const emptySubscribe = () => () => {}

export function TimeIsland() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [time, setTime] = useState<Date>(() => new Date())

  useEffect(() => {
    let timerId: number

    const tick = () => {
      const now = new Date()
      setTime(now)
      const delay = 1000 - now.getMilliseconds()
      timerId = window.setTimeout(tick, delay)
    }

    const now = new Date()
    const initialDelay = 1000 - now.getMilliseconds()
    timerId = window.setTimeout(tick, initialDelay)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [])

  if (!isMounted) {
    return (
      <div suppressHydrationWarning className="flex flex-col items-center">
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
