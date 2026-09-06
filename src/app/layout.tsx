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
      <head>
        <link rel="preconnect" href="https://img.aloys23.link" crossOrigin="" />
        <link rel="dns-prefetch" href="https://img.aloys23.link" />
        <link rel="preconnect" href="https://api.aloys23.link" crossOrigin="" />
        <link rel="dns-prefetch" href="https://api.aloys23.link" />
        <link rel="preconnect" href="https://cn.bing.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cn.bing.com" />
        <script
          defer
          src="https://tongji.aloys233.top/analytics.js"
          data-website-id="3be7e1b3-88bd-4a"
        />
      </head>
      <body className="bg-[#050510] text-white overflow-x-hidden selection:bg-white/30">
        {children}
      </body>
    </html>
  )
}
