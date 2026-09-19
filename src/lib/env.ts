const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

/**
 * 后端 API 源（Go 服务，见 backend/）。
 * 前端所有 /api/* 请求都直连此处，不再依赖同源反向代理。
 */
export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.PUBLIC_API_BASE_URL ??
    'https://start-api.aloys233.top',
)

/**
 * Logto 资源指示符，即后端校验的 JWT audience。
 * 必须与后端 application.yaml 的 LOGTO_AUDIENCE 保持一致，否则接口一律 401。
 */
export const LOGTO_RESOURCE =
  process.env.NEXT_PUBLIC_LOGTO_RESOURCE ?? process.env.PUBLIC_LOGTO_RESOURCE ?? API_BASE_URL

export const LOGTO_ENDPOINT =
  process.env.NEXT_PUBLIC_LOGTO_ENDPOINT ??
  process.env.PUBLIC_LOGTO_ENDPOINT ??
  'https://auth.aloys233.top/'

export const LOGTO_APP_ID =
  process.env.NEXT_PUBLIC_LOGTO_APP_ID ?? process.env.PUBLIC_LOGTO_APP_ID ?? '1qeu84y9ylavx1i7k6bgt'
