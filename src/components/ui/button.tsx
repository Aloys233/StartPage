"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'default' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-white text-black shadow-xl shadow-white/10 hover:bg-white/90 active:scale-[0.98]',
  ghost:
    'bg-transparent text-white/28 hover:text-white/65',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-[18px] font-semibold transition-all disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
