"use client"

import { Calendar } from 'lucide-react'

interface TimeHeaderProps {
  timeStr: string
  dateStr: string
}

export function TimeHeader({ timeStr, dateStr }: TimeHeaderProps) {
  return (
    <div className="group relative z-40 mb-[6vh] cursor-default select-none text-center text-white animate-fade duration-500">
      <div className="font-clock text-[clamp(4.5rem,14vw,8.5rem)] leading-none tracking-tight [text-shadow:0_4px_32px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105 font-normal">
        {timeStr}
      </div>
      <div className="mt-7 flex items-center justify-center gap-3 text-[clamp(1.05rem,1.7vw,1.25rem)] font-medium text-white/90 tracking-[0.32em] uppercase [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] transition-all duration-300 group-hover:tracking-[0.38em]">
        <Calendar className="h-5 w-5 opacity-80" />
        {dateStr}
      </div>
    </div>
  )
}
