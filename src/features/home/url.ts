const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:'])

const hasProtocol = (value: string) => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)

export const normalizeUrl = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const candidate = hasProtocol(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(candidate)
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export const buildFaviconUrl = (url: string): string => {
  const hostname = getHostname(url)
  if (!hostname || hostname === url) {
    return ''
  }
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
}

export const openExternalLink = (url: string) => {
  const safeUrl = normalizeUrl(url)
  if (!safeUrl) {
    console.error('Blocked opening unsupported URL', url)
    return
  }
  window.open(safeUrl, '_blank', 'noopener,noreferrer')
}
