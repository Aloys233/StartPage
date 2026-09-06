import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Start',
  description: 'A clean and elegant personal start page',
  icons: {
    icon: '/vite.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#050510] text-white overflow-x-hidden selection:bg-white/30">
        {children}
      </body>
    </html>
  )
}
