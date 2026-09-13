export const BSS_CATEGORIES = ['전체', '정보', '사건사고', '경제', '칼럼', '기타'] as const

export type BssCategory = (typeof BSS_CATEGORIES)[number]

export type BssArticle = {
  id: string
  category: Exclude<BssCategory, '전체'>
  title: string
  summary: string
  author: string
  publishedAt: string
  body: string[]
  likes: number
  comments: number
  imageTone: 'broadcast' | 'city' | 'field'
}

export const BSS_ARTICLES: BssArticle[] = [
  {
    id: 'bss-opening',
    category: '정보',
    title: '봉누도 전문 방송국 BBS 개국, 보도국장 이윤진 외 9명',
    summary: '봉누도 곳곳의 소식을 빠르게 전하는 BBS가 첫 방송을 시작했습니다.',
    author: '선비희',
    publishedAt: '2026-09-12T21:46:00+09:00',
    body: [
      'today(오늘) 9월 12일, 봉누도에서 BBS 방송국을 개국(open)했다.',
      '이윤진 보도국장을 시작으로 총 9명의 기자들이 취재에 나섰다.',
      '사진을 보면 가운데 이윤진 보도국장을 중심으로 모든 기자들의 모습이 찍혔다.',
      '첫 시작은 down 된 느낌이 없잖아 있다.',
      '앞으로 방송국에서 보일 행보에 관해 시민들의 많은 관심을 보일 것으로 예상된다.',
    ],
    likes: 2,
    comments: 2,
    imageTone: 'broadcast',
  },
  {
    id: 'city-briefing',
    category: '사건사고',
    title: '봉누도 곳곳에서 포착된 새로운 움직임',
    summary: '시민 제보를 바탕으로 오늘의 주요 현장을 정리했습니다.',
    author: 'BBS 취재팀',
    publishedAt: '2026-09-12T18:10:00+09:00',
    body: [
      'BBS 취재팀은 오늘 접수된 시민 제보를 바탕으로 주요 현장을 확인했다.',
      '현장 관계자들의 이야기를 종합하면 추가 상황이 이어질 가능성도 남아 있다.',
      'BBS는 확인된 사실을 중심으로 후속 소식을 전할 예정이다.',
    ],
    likes: 0,
    comments: 0,
    imageTone: 'city',
  },
  {
    id: 'market-watch',
    category: '경제',
    title: '이번 주 봉누도 경제 브리핑',
    summary: '시장과 상점가에서 확인된 주요 경제 소식을 살펴봅니다.',
    author: 'BBS 경제부',
    publishedAt: '2026-09-11T15:30:00+09:00',
    body: [
      '이번 주 봉누도 시장에서는 여러 품목의 거래가 활발하게 이어졌다.',
      '상점가 관계자들은 다음 주에도 비슷한 흐름이 이어질 것으로 전망했다.',
    ],
    likes: 1,
    comments: 0,
    imageTone: 'field',
  },
]

export function getBssArticle(id: string) {
  return BSS_ARTICLES.find((article) => article.id === id) ?? null
}
