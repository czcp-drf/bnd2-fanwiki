export const BBS_CATEGORY_OPTIONS = [
  { key: 'info', label: '정보' },
  { key: 'incident', label: '사건사고' },
  { key: 'economy', label: '경제' },
  { key: 'column', label: '칼럼' },
  { key: 'other', label: '기타' },
] as const

export type BbsCategoryKey = (typeof BBS_CATEGORY_OPTIONS)[number]['key']
export type BbsCategory = '전체' | (typeof BBS_CATEGORY_OPTIONS)[number]['label']

export const BBS_CATEGORIES = ['전체', ...BBS_CATEGORY_OPTIONS.map((option) => option.label)] as BbsCategory[]

export type BbsArticleMedia = {
  id: string
  imageUrl: string
  sortOrder: number
}

export type BbsArticle = {
  id: string
  category: BbsCategory
  categoryKey: BbsCategoryKey
  title: string
  summary: string
  content: string
  author: string
  approvedAt: string
  thumbnailUrl: string | null
  media: BbsArticleMedia[]
}

export function getBbsCategoryKey(value: string | undefined | null) {
  const option = BBS_CATEGORY_OPTIONS.find((item) => item.key === value || item.label === value)
  return option?.key ?? null
}

export function getBbsCategoryLabel(key: string) {
  return BBS_CATEGORY_OPTIONS.find((option) => option.key === key)?.label ?? '기타'
}
