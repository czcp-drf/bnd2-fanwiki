'use client'

import { useRedPill } from '@/lib/context/RedPillContext'

/**
 * 클립 라벨에서 스트리머명 ↔ 캐릭터명 자동 변환
 * - 빨간약 OFF: 라벨 내 스트리머명 → 캐릭터명으로 치환
 * - 빨간약 ON: 원본 라벨 그대로 표시
 * (매핑은 해당 사건 참여자 기준)
 */
export default function ClipLabel({
  label,
  streamerToChar,
}: {
  label: string
  streamerToChar: Record<string, string>
}) {
  const { isRedPill } = useRedPill()

  if (isRedPill) return <>{label}</>

  // 긴 이름부터 치환해서 부분 문자열 오치환 방지
  const sorted = Object.entries(streamerToChar).sort((a, b) => b[0].length - a[0].length)
  let result = label
  for (const [streamer, char] of sorted) {
    result = result.split(streamer).join(char)
  }

  return <>{result}</>
}
