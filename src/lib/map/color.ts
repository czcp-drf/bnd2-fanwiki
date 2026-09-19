// SVG 문자열에 삽입할 색상은 6자리 HEX로 제한합니다.
export function isMapColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

export function safeMapColor(value: unknown, fallback = '#71717a'): string {
  return isMapColor(value) ? value : isMapColor(fallback) ? fallback : '#71717a'
}
