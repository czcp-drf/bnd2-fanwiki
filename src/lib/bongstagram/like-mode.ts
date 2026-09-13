export type BongstagramLikeMode = 'server' | 'local'

export function getBongstagramLikeMode(): BongstagramLikeMode {
  return process.env.BONGSTAGRAM_LIKES_MODE?.trim().toLowerCase() === 'local' ? 'local' : 'server'
}
