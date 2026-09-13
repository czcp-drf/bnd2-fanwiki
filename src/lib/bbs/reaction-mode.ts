export type BbsReactionMode = 'server' | 'local'

export function getBbsReactionMode(): BbsReactionMode {
  return process.env.BBS_REACTIONS_MODE?.trim().toLowerCase() === 'server' ? 'server' : 'local'
}
