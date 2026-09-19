'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { LayoutGrid } from 'lucide-react'
import { SiBilibili, SiGithub, SiOpenai, SiV2Ex, SiYoutube } from 'react-icons/si'
import { getHostname } from '@/features/home/url'

interface ShortcutIconProps {
  title: string
  /** 用于兜底匹配品牌图标的链接；仅靠标题匹配会漏掉中英文混排的命名 */
  url?: string
  /** 预取/预计算的图标地址（favicon）。为空或加载失败时回退到通用图标。 */
  icon?: string
}

// 用「标题 + 域名」整体做关键词匹配，避免只按标题匹配导致的漏判。
// 这里存的是元素而不是组件：渲染期取组件再实例化会被 react-hooks 规则判为
// 「在渲染中创建组件」，直接复用元素则没有这个问题。
const BRANDS: Array<{ keywords: string[]; element: ReactElement }> = [
  { keywords: ['github'], element: <SiGithub className="h-7 w-7" /> },
  { keywords: ['bilibili'], element: <SiBilibili className="h-7 w-7" /> },
  { keywords: ['youtube'], element: <SiYoutube className="h-7 w-7" /> },
  { keywords: ['chatgpt', 'openai'], element: <SiOpenai className="h-7 w-7" /> },
  { keywords: ['v2ex'], element: <SiV2Ex className="h-7 w-7" /> },
]

const resolveBrandIcon = (title: string, url?: string): ReactElement | null => {
  const haystack = `${title} ${url ? getHostname(url) : ''}`.toLowerCase()
  return BRANDS.find((brand) => brand.keywords.some((keyword) => haystack.includes(keyword)))?.element ?? null
}

/**
 * 快捷方式图标：品牌图标优先，其次是 favicon，最后回退通用图标。
 *
 * favicon 走的是第三方服务，在国内网络或对方限流时会加载失败 ——
 * 必须靠 onError 降级，否则会留下一个空白（裂图）占位。
 */
export function ShortcutIcon({ title, url, icon }: ShortcutIconProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const brandIcon = resolveBrandIcon(title, url)
  if (brandIcon) {
    return brandIcon
  }

  if (icon && icon !== failedSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt={title}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(icon)}
        className="h-8 w-8 object-contain opacity-90"
      />
    )
  }

  return <LayoutGrid className="h-7 w-7 opacity-70" />
}
