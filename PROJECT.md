# 봉누도2 위키 — 프로젝트 가이드

> AI 에이전트(Claude Code, Codex 등)가 공통으로 참조하는 프로젝트 지식 문서입니다.
> 기능을 추가하거나 구조를 변경할 때 이 파일도 함께 업데이트해 주세요.

---

## 개요

GTA RP 서버 "봉누도2"의 팬 위키 사이트.
스트리머, 캐릭터, 조직, 사건 아카이브를 제공하며 **빨간약 토글**로 스트리머 정보 공개 여부를 제어합니다.

---

## 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | Next.js 15+ (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| DB / Auth | Supabase (PostgreSQL) |
| 지도 | react-leaflet (GTA V 커스텀 CRS) |
| 아이콘 | lucide-react |
| 배포 | Vercel — `https://bnd2-fanwiki.vercel.app/` |

---

## 디렉토리 구조

```
src/
├── app/                        # Next.js App Router 페이지
│   ├── page.tsx                # 홈 (통계, 최근 사건, 빠른 링크) [ISR 60s]
│   ├── live/page.tsx           # 라이브 현황 (현재 LIVE_ENABLED=false로 안내만 표시) [ISR 60s]
│   ├── streamers/              # 스트리머 목록 / 상세 [ISR 60s]
│   ├── characters/             # 캐릭터 목록 / 상세 [ISR 300s]
│   ├── organizations/          # 조직 목록 / 상세 [ISR 300s]
│   ├── events/                 # 사건 목록 / 상세 / 연대표 [ISR 300s]
│   ├── map/                    # 공개 거점 지도 [ISR 300s]
│   │   ├── page.tsx            # 서버 컴포넌트 (orgs + locations 패치)
│   │   ├── MapView.tsx         # 클라이언트 래퍼 (카테고리 필터, 위치 토글)
│   │   ├── LeafletMap.tsx      # Leaflet 지도 본체 (SSR 제외, dynamic import)
│   │   └── MapPinPopup.css     # 팝업 opacity 전환 제거 (꼬리표 지연 없는 닫기)
│   ├── search/page.tsx         # 통합 검색
│   ├── schedule/               # 방송 일정
│   ├── guide/                  # 입문 가이드
│   ├── report/                 # 제보 폼
│   ├── api/
│   │   └── live-status/route.ts  # Chzzk 라이브 상태 API (LIVE_ENABLED=false 시 503)
│   └── admin/                  # 관리자 페이지 (로그인 필요)
│       ├── page.tsx            # 대시보드 (통계, 미정 캐릭터·미처리 제보 바로가기)
│       ├── layout.tsx          # 어드민 사이드바 레이아웃
│       ├── login/              # 로그인 페이지 + actions
│       ├── characters/         # 캐릭터 CRUD
│       ├── organizations/      # 조직 CRUD
│       ├── events/             # 사건 CRUD + 참여자/클립 편집
│       ├── relationships/      # 캐릭터 관계 CRUD
│       ├── streamers/          # 스트리머 CRUD (display_name, chzzk_channel_id, profile_image_url, is_active)
│       ├── map/                # 거점 지도 관리 (90vh 전체 화면)
│       │   ├── page.tsx
│       │   ├── AdminMapView.tsx  # 탭 UI (조직 거점 / 작업 위치)
│       │   ├── AdminLeafletMap.tsx  # 어드민 전용 Leaflet 지도
│       │   └── actions.ts      # updateOrgHq, addMapLocation, updateMapLocation, deleteMapLocation
│       ├── reports/            # 제보 관리 (상태 필터, 상태 변경, IP 차단, 좌표 → 작업 위치 추가)
│       │   └── ReportCoordAction.tsx  # 좌표 제보 파싱 → 작업 위치 직접 추가 클라이언트 컴포넌트
│       └── blocked-ips/        # 차단 IP 목록 + 해제
│
├── components/
│   ├── layout/Header.tsx       # 글로벌 네비게이션 (빨간약 토글, 검색, 모바일 Sheet)
│   ├── map/
│   │   ├── MapBaseLayers.tsx   # Atlas / 위성 타일 전환 레이어 컨트롤 (react-leaflet LayersControl)
│   │   └── MapBaseLayers.css   # 레이어 컨트롤 커스텀 스타일
│   ├── ui/
│   │   ├── StreamerMask.tsx    # StreamerReveal / StreamerBlur 컴포넌트
│   │   ├── AppImage.tsx        # 이미지 컴포넌트 (unoptimized, 외부 URL 허용)
│   │   ├── Select.tsx          # 커스텀 셀렉트
│   │   ├── button.tsx          # shadcn 버튼
│   │   ├── sheet.tsx           # shadcn Sheet (모바일 메뉴)
│   │   └── DropdownPortal.tsx
│   ├── streamers/
│   │   └── StreamerListWithLive.tsx  # 온라인/오프라인/비활동 분류 카드 리스트
│   ├── characters/
│   │   └── CharacterFilters.tsx
│   ├── events/
│   │   ├── TimelineView.tsx    # 연대표 (가로/세로 모드)
│   │   ├── TimelineFilters.tsx
│   │   ├── EventTypeFilter.tsx
│   │   └── ClipLabel.tsx       # 클립 라벨 스트리머명↔캐릭터명 치환
│   ├── live/
│   │   └── LiveDataError.tsx   # 라이브 데이터 로드 실패 UI
│   └── report/
│       ├── ReportForm.tsx          # 제보 폼 (지도 핀 위치 첨부 포함)
│       └── MapPinPicker.tsx        # Leaflet 지도 핀 찍기 컴포넌트 (SSR 제외, dynamic import)
│
├── lib/
│   ├── context/RedPillContext.tsx   # 빨간약 전역 상태 (localStorage 유지)
│   ├── events.ts                    # typeLabel / typeColor 공유 상수
│   ├── utils.ts                     # cn() 등 유틸
│   ├── dropdown-keyboard.ts
│   ├── map/
│   │   └── constants.ts            # MAP_TILE_URLS, GTA_CRS_CONFIG, MAP_MAX_BOUNDS, CATEGORY_COLOR/LABEL 등
│   ├── live/
│   │   ├── config.ts               # LIVE_ENABLED 플래그 (현재 false)
│   │   ├── status.ts               # LiveStatus 타입, checkChannelLive()
│   │   └── useLiveStatus.ts        # 라이브 상태 훅 (60초 자동갱신)
│   ├── data/
│   │   ├── live-streamers.ts        # getLiveStreamers() 서버사이드 데이터
│   │   └── organizations.ts         # getOrganizationFilterOptions()
│   ├── admin/
│   │   └── auth.ts                  # requireAdmin() (쿠키 검증, 미인증 시 리다이렉트)
│   └── supabase/
│       ├── server.ts               # 서버 클라이언트
│       ├── client.ts               # 클라이언트 클라이언트
│       └── admin.ts                # 서비스 롤 클라이언트 (어드민 전용)
│
├── types/
│   └── database.ts                  # DB 타입 정의 (Supabase 테이블 Row/Insert/Update)
│
└── proxy.ts                         # 미들웨어 파일 (middleware.ts 아님 — 이 Next.js 버전 컨벤션)
                                     # export function proxy() — /admin/* 보호, /admin/login 제외
```

---

## 핵심 개념

### 빨간약 (RedPill) 토글
- `RedPillContext` — 전역 boolean 상태, localStorage 유지
- **OFF (기본)**: 스트리머 정보 숨김, 캐릭터 정보만 표시
- **ON**: 스트리머 이름/이미지 공개
- `StreamerReveal`: RedPill OFF 시 자식 숨김
- `StreamerBlur`: RedPill OFF 시 자식 블러 처리 (숨기지는 않음)
- 헤더의 빨간약/파란약 토글 버튼으로 전환 (compact 모드는 모바일 Sheet 내)

### 라이브 상태
- 트래픽 관리를 위해 현재 임시 중단: `src/lib/live/config.ts`의 `LIVE_ENABLED = false`
- 홈 라이브 섹션과 메뉴 항목은 LIVE_ENABLED 에 따라 조건부 렌더링
- `/live`는 LIVE_ENABLED=false 시 안내 메시지만 표시
- `/api/live-status`는 LIVE_ENABLED=false 시 503 반환 (외부 조회 차단)
- 재개 시 `LIVE_ENABLED = true`로 변경 후 재배포
- `/api/live-status?ids=...` — Chzzk API 호출 (v3.3 → v2 폴백), `Cache-Control: s-maxage=30, stale-while-revalidate=60`
- `live: true` = 방송 중, `live: false` = 오프라인, `live: null` = 확인 불가
- `useLiveStatus` 훅 — 60초 자동갱신, 탭 숨김 시 일시정지, retry 지원
- 채널 ID 형식: 32자 소문자 hex

### 어드민 인증
- 쿠키 기반 토큰 인증 (`ADMIN_PASSWORD`, `ADMIN_TOKEN` 환경변수)
- `requireAdmin()` — 쿠키 검증 후 미인증 시 `/admin/login` 리다이렉트
- `src/proxy.ts` — 미들웨어 파일 (`middleware.ts` 아님, 이 Next.js 버전의 컨벤션)
- `export function proxy()` — 미들웨어 함수명
- `/admin/*` 전체 보호, `/admin/login` 제외
- AdminLayout에 auth 체크 넣으면 `/admin/login`에서 무한 리다이렉트 발생 — 하지 말 것

### 지도 시스템
- **타일맵**: Atlas / 위성(Satellite) 두 가지 스타일 전환 가능 (`MapBaseLayers.tsx`)
- 기본 스타일: Atlas (`#0FA8D2` 배경), 위성 스타일: `#153E6A` 배경
- **GTA V 커스텀 CRS**: `L.CRS.Simple` 기반, `src/lib/map/constants.ts`의 `GTA_CRS_CONFIG` 파라미터 사용
  - `centerX: 117.3, centerY: 172.8, scaleX: 0.02072, scaleY: 0.0205`
  - `new L.Transformation(scaleX, centerX, -scaleY, centerY)`
- **좌표 저장 규칙**: `hq_x` = GTA X축 (Leaflet lng), `hq_y` = GTA Y축 (Leaflet lat)
- Leaflet 컴포넌트는 항상 `dynamic(() => import(...), { ssr: false })`로 로드
- 공개 지도 팝업: 선택한 핀 위 Leaflet Popup (지도 이동 따라감, Escape/빈 영역 클릭으로 닫기)
- 어드민 지도: 클릭으로 좌표 찍기 → 저장 패널 → Server Action으로 저장 + revalidatePath
- 조직 상세 `/organizations/[id]`에서 `/map?org=<ID>`로 이동하면 해당 핀 자동 선택·확대

### 타일 Storage
- Supabase Storage 공개 버킷: `map-tiles`
- 경로: `mapStyles/styleAtlas/{z}/{x}/{y}.jpg` / `mapStyles/styleSatelite/{z}/{x}/{y}.jpg`
- `NEXT_PUBLIC_MAP_TILE_BASE` = Supabase 프로젝트 URL + `/storage/v1/object/public/map-tiles`
  - 로컬 개발 시 미설정 → `public/mapStyles/`를 직접 서빙
  - `public/mapStyles/`는 `.gitignore`에 추가됨 (용량 약 436MB)
- 업로드 스크립트: `node --env-file=.env.local scripts/upload-map-tiles.mjs` (Node 22 이상)
  - 기존 파일은 덮어쓰지 않고 건너뜀, 실패한 업로드는 재시도
  - 업로드 결과: 이미지 4,101개 완료 (원본 `satellite.png` 약 68MB는 Storage 크기 제한으로 제외)

### ISR (Incremental Static Regeneration)
| 페이지 | revalidate |
|---|---|
| `/` | 60s |
| `/live`, `/streamers`, `/streamers/[id]` | 60s |
| `/characters`, `/characters/[id]` | 300s |
| `/organizations`, `/organizations/[id]` | 300s |
| `/events`, `/events/[id]`, `/events/timeline` | 300s |
| `/map` | 300s |

---

## DB 주요 테이블

| 테이블 | 설명 |
|---|---|
| `streamers` | 스트리머 (chzzk_channel_id, display_name, profile_image_url, is_active) |
| `characters` | RP 캐릭터 (name, alias[], job, status, avatar_url) |
| `organization_members` | 캐릭터↔조직 N:M (role, is_primary, joined_at, left_at) |
| `organizations` | 조직 (category, color, hq_x, hq_y, hq_label, is_active, is_disbanded) |
| `map_locations` | 작업 위치 핀 (name, label, description, color, x, y) |
| `events` | 사건 아카이브 (type, occurred_at, is_published) |
| `event_participants` | 사건↔캐릭터 N:M (role) |
| `event_clips` | 사건 클립 (clip_url, label, streamer_id, sort_order) |
| `character_relationships` | 캐릭터 관계 (type: friend/enemy/rival/family/romantic/ally/mentor/neutral) |
| `reports` | 제보 (type, status: pending/reviewing/applied/rejected, ip) |
| `blocked_ips` | 차단 IP 목록 (ip, reason) |

### 마이그레이션 파일 (supabase/migrations/)
| 파일 | 내용 |
|---|---|
| 001~009 | 초기 스키마, 조직 카테고리, 연락처, 해산, 원자적 저장, IP 신고·차단 |
| `010_org_hq.sql` | organizations 테이블에 hq_x, hq_y, hq_label 컬럼 추가 |
| `011_map_locations.sql` | map_locations 테이블 생성 (RLS 포함) |

---

## 구현 완료 기능

### 공개 페이지
- [x] 홈 — 통계, 최근 사건, 빠른 링크 (라이브 섹션은 LIVE_ENABLED 조건부)
- [x] `/live` — 온라인/오프라인 실시간 분류, 조직 필터 (현재 임시 중단 안내)
- [x] `/streamers` — 목록 (라이브 확인 없이 디렉토리 형태)
- [x] `/streamers/[id]` — 스트리머 상세
- [x] `/characters` — 목록 + 필터
- [x] `/characters/[id]` — 상세 (소속 조직, 인물 관계, 참여 사건)
- [x] `/organizations` — 목록 (갱단/공무직/사업체 등)
- [x] `/organizations/[id]` — 상세 (멤버, 운영 사업체, 관련 사건, 지도 바로가기)
- [x] `/map` — GTA V 거점 지도 (조직 핀 + 작업 위치 핀, Atlas/위성 전환, 카테고리 필터)
- [x] `/events` — 목록 + 타입 필터
- [x] `/events/[id]` — 상세 (참여자, 클립)
- [x] `/events/timeline` — 연대표 (가로/세로, 캐릭터/조직/전체 필터)
- [x] `/search` — 통합 검색 (캐릭터/스트리머/사건/조직, 조직·사건 확장 카드)
- [x] `/schedule`, `/guide`, `/report` — 일정, 가이드, 제보 폼 (지도 핀 위치 첨부 기능 포함)

### 어드민 (`/admin/*`)
- [x] 대시보드 — 통계, 미정 캐릭터·미처리 제보 바로가기
- [x] 캐릭터/조직/사건/관계 CRUD
- [x] 사건 인라인 삭제 (2단계 확인)
- [x] 스트리머 관리 — 추가/수정/삭제, 치지직 채널 ID·프로필 이미지 관리
- [x] 거점 지도 관리 — 조직 거점 클릭 배치, 작업 위치 추가/수정/이동/삭제
- [x] 제보 관리 — 상태 필터, 상태 변경, IP 차단 버튼, 좌표 제보 시 작업 위치 직접 추가
- [x] IP 차단 관리 — 차단 목록 확인, 차단 해제

---

## 환경변수

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 서비스 롤 key (어드민, 업로드 스크립트) |
| `ADMIN_PASSWORD` | 어드민 로그인 비밀번호 |
| `ADMIN_TOKEN` | 어드민 쿠키 검증 토큰 |
| `NEXT_PUBLIC_MAP_TILE_BASE` | 지도 타일 CDN 베이스 URL (Supabase Storage, 미설정 시 public/ 직접 서빙) |

---

## 코딩 컨벤션

- 서버 컴포넌트 기본, 상호작용 필요 시 `'use client'`
- 공유 상수는 `src/lib/` 아래 별도 파일로 분리 (`events.ts`, `map/constants.ts` 등)
- Supabase 쿼리는 서버 컴포넌트/서버 액션에서만 직접 실행
- 클라이언트에서 DB가 필요하면 API Route 경유
- 타입은 inline으로, 재사용 필요 시 `src/types/database.ts` 참조
- 이미지는 `AppImage` 컴포넌트 사용 (`unoptimized` 속성 → remotePatterns 설정 불필요)
- Leaflet 컴포넌트는 반드시 `dynamic(() => import(...), { ssr: false })`로 로드
- 어드민 Server Action 후 `revalidatePath('/admin/...')` + 관련 공개 경로도 함께 무효화

---

## 최근 작업 기록

모든 커밋은 `deploy/main`에 푸시 완료. 배포 완료 여부는 Vercel에서 별도 확인.

| 커밋 | 작업 내용 |
|---|---|
| `f131609` | 제보 폼에 지도 핀 위치 첨부 기능 추가, 어드민 제보에서 좌표 → 작업 위치 직접 추가 |
| `2829736` | 말풍선 꼬리표의 페이드 지연 제거 |
| `6ef9dd5` | 하단 고정 카드를 선택한 핀 위 말풍선으로 변경 |
| `95b9efb` | 지도와 조직 상세 연결, 핀 카드 디자인, 지도별 배경색 적용 |
| `64aeaff` | 지도 전환 메뉴를 사이트 테마에 맞게 커스텀 |
| `58e5c63` | 공개·관리자 Atlas ↔ 위성 전환, Atlas 기본값 |
| `5eb3e59` | 홈 라이브 섹션·메뉴 숨김, 라이브 페이지 안내, API 503 반환 |
| `58cb328` | 관리자 지도 높이 90vh 적용 |
| `6674c19` | Storage 업로드 스크립트·연결 문서 추가, 지도 바다 배경 적용 |
| `e08c3cd` | 지도를 위성 단일 스타일로 단순화, TILE_URL 상수 통합 |
| `8b86e5f` | 지도·스트리머 관리·ISR·스팸 방지 기능 추가 |
