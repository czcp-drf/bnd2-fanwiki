// 타일 베이스 URL
// - 로컬 개발: NEXT_PUBLIC_MAP_TILE_BASE 미설정 → /mapStyles/... (public 폴더 직접 서빙)
// - 프로덕션: NEXT_PUBLIC_MAP_TILE_BASE=https://your-r2.r2.dev 등 CDN URL 설정
const TILE_BASE = process.env.NEXT_PUBLIC_MAP_TILE_BASE ?? ''

export const MAP_TILE_URLS = {
  atlas: `${TILE_BASE}/mapStyles/styleAtlas/{z}/{x}/{y}.jpg`,
  satellite: `${TILE_BASE}/mapStyles/styleSatelite/{z}/{x}/{y}.jpg`,
}

// 줌 설정 (RiceaRaul/gta-v-map-leaflet 기준)
export const MAP_MIN_ZOOM = 2
export const MAP_MAX_ZOOM = 5
export const MAP_DEFAULT_ZOOM = 3

// GTA V 세계 좌표 경계 [[minY, minX], [maxY, maxX]]
export const MAP_MAX_BOUNDS = [[-4000, -5500], [8000, 6000]] as [[number, number], [number, number]]

// 타일 피라미드 전체 범위. 커스텀 CRS의 0레벨 256px 세계를 역변환한 값으로,
// 타일 파일이 존재하는 x/y = 0 ~ 2^z-1 영역만 TileLayer가 요청하도록 제한합니다.
export const MAP_TILE_BOUNDS = [[-4058.5366, -5661.1969], [8429.2683, 6694.0154]] as [[number, number], [number, number]]

// GTA V CRS 변환 파라미터 (출처: RiceaRaul/gta-v-map-leaflet)
export const GTA_CRS_CONFIG = {
  centerX: 117.3,
  centerY: 172.8,
  scaleX: 0.02072,
  scaleY: 0.0205,
}

// 카테고리별 색상·라벨
export const CATEGORY_COLOR: Record<string, string> = {
  city_hall: '#6366f1',
  public_service: '#3b82f6',
  gang: '#f97316',
  business: '#10b981',
  illegal: '#ef4444',
}

export const CATEGORY_LABEL: Record<string, string> = {
  city_hall: '시청',
  public_service: '공무직',
  gang: '갱단',
  business: '사업체',
  illegal: '불법 사업체',
}
