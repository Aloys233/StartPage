"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'cards h-13 w-full rounded-xl border border-white/15 px-4 text-base text-white outline-none transition-all placeholder:text-white/35 focus:border-white/40 focus:bg-black/45 aria-invalid:border-red-400/80 [--card-hover-scale:1]',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
