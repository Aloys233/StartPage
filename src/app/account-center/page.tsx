"use client"

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { WALLPAPER_FALLBACK } from '@/features/home/constants'
import { AuthIsland } from '@/features/home/islands/AuthIsland'

const accountItems = [
  { label: '账户中心首页', path: '/account' },
  { label: '邮箱', path: '/account/email' },
  { label: '用户名', path: '/account/username' },
  { label: '密码', path: '/account/password' },
  { label: 'Passkey 添加', path: '/account/passkey/add' },
  { label: 'Passkey 管理', path: '/account/passkey/manage' },
  { label: '验证器 App', path: '/account/authenticator-app' },
  { label: '备份码生成', path: '/account/backup-codes/generate' },
  { label: '备份码管理', path: '/account/backup-codes/manage' },
]

const logtoEndpoint =
  process.env.NEXT_PUBLIC_LOGTO_ENDPOINT ||
  process.env.PUBLIC_LOGTO_ENDPOINT ||
  'https://auth.aloys233.top/'
const logtoBase = logtoEndpoint.endsWith('/') ? logtoEndpoint : `${logtoEndpoint}/`

const subscribeUrl = (onStoreChange: () => void) => {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

export default function AccountCenterPage() {
  const currentUrl = useSyncExternalStore(
    subscribeUrl,
    () => window.location.href,
    () => '',
  )

  const buildAccountUrl = (path: string) => {
    try {
      const url = new URL(path.replace(/^\//, ''), logtoBase)
      if (currentUrl) {
        url.searchParams.set('redirect', currentUrl)
      }
      return url.toString()
    } catch {
      return `${logtoBase}${path.replace(/^\//, '')}`
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-white/30">
      <div
        className="absolute inset-0 bg-[#050510] bg-cover bg-center transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ backgroundImage: WALLPAPER_FALLBACK }}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage:
            'radial-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%), radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%)',
        }}
      />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 pt-6">
        <Link
          href="/"
          className="cards inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:text-white [--card-hover-scale:1.05]"
        >
          返回首页
        </Link>
        <div className="w-full max-w-[760px] sm:w-auto sm:max-w-none sm:flex-1 sm:justify-end sm:flex">
          <AuthIsland />
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pb-16 pt-12">
        <section className="w-full max-w-[960px]">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-white/50">Logto Account Center</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
              账户与安全设置
            </h1>
            <p className="mt-3 text-sm text-white/60">
              使用 Logto 账户中心完成身份验证、安全策略与凭据管理。
            </p>
          </div>

          <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
            {accountItems.map((item) => (
              <a
                key={item.path}
                href={buildAccountUrl(item.path)}
                className="cards group flex items-center justify-between rounded-2xl border border-white/15 px-5 py-4 text-sm text-white/90 shadow-lg transition [--card-hover-scale:1.02] hover:border-white/35"
              >
                <span className="font-semibold tracking-[0.08em]">{item.label}</span>
                <span className="text-xs uppercase tracking-[0.24em] text-white/45 transition group-hover:text-white/85">
                  打开
                </span>
              </a>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-white/45">
            更新成功后将自动返回此页面。
          </p>
        </section>
      </main>
    </div>
  )
}
