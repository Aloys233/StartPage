/**
 * 生成客户端本地 ID。
 *
 * 必须保证结果始终是 UUID 形状：这些 id 会被直接发给后端
 * （create 请求携带 UUID id 以保证幂等），不能出现 `local-...` 这类非法格式。
 */
const fallbackUuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })

export const createLocalId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return fallbackUuid()
}
