export async function loadOgFonts() {
  const [korean, latin] = await Promise.all([
    fetch(
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5/files/noto-sans-kr-korean-700-normal.woff2'
    ).then((r) => r.arrayBuffer()),
    fetch(
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5/files/noto-sans-kr-latin-700-normal.woff2'
    ).then((r) => r.arrayBuffer()),
  ])
  return [
    { name: 'NotoKR', data: korean, weight: 700 as const, style: 'normal' as const },
    { name: 'NotoKR', data: latin, weight: 700 as const, style: 'normal' as const },
  ]
}

export const OG_SIZE = { width: 1200, height: 630 }
