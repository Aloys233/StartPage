"use client"

import React from 'react'
import { Calendar } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface DigitSlotProps {
  digit: string
}

const DigitSlot: React.FC<DigitSlotProps> = ({ digit }) => {
  return (
    <div
      suppressHydrationWarning
      className="relative inline-flex overflow-hidden h-[1.25em] w-[0.72em] shrink-0 items-center justify-center text-center"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          suppressHydrationWarning
          initial={{ y: '65%', opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-65%', opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full text-center inline-block leading-none"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

interface DigitGroupProps {
  value: string | number
}

const DigitGroup: React.FC<DigitGroupProps> = ({ value }) => {
  const str = String(value).padStart(2, '0')
  return (
    <div className="inline-flex items-center justify-center shrink-0">
      <DigitSlot digit={str[0]} />
      <DigitSlot digit={str[1]} />
    </div>
  )
}

interface TimeHeaderProps {
  hour: string | number
  minute: string | number
  second: string | number
  dateStr: string
}

export function TimeHeader({ hour, minute, second, dateStr }: TimeHeaderProps) {
  return (
    <div className="group relative z-40 mb-[6vh] cursor-default select-none text-center text-white animate-fade duration-500">
      {/* 核心大数字时钟：时:分:秒，纯净通透，无任何突兀黑阴影，槽位宽裕绝无裁切 */}
      <div
        suppressHydrationWarning
        className="font-clock flex items-center justify-center text-[clamp(3.2rem,8.5vw,6.8rem)] leading-none tracking-normal transition-transform duration-500 group-hover:scale-105 font-normal tabular-nums"
      >
        <DigitGroup value={hour} />
        <span className="w-[0.32em] shrink-0 inline-flex items-center justify-center text-center opacity-80 select-none pb-[0.06em]">
          :
        </span>
        <DigitGroup value={minute} />
        <span className="w-[0.32em] shrink-0 inline-flex items-center justify-center text-center opacity-80 select-none pb-[0.06em]">
          :
        </span>
        <DigitGroup value={second} />
      </div>

      {/* 年月日与星期 */}
      <div
        suppressHydrationWarning
        className="mt-6 flex items-center justify-center gap-3 text-[clamp(1rem,1.5vw,1.2rem)] font-medium text-white/85 tracking-[0.28em] uppercase [text-shadow:0_1px_8px_rgba(0,0,0,0.25)] transition-all duration-300 group-hover:tracking-[0.34em]"
      >
        <Calendar className="h-4 w-4 opacity-80" />
        {dateStr}
      </div>
    </div>
  )
}

