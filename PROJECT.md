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
│   │   ├── page.tsx            # 목록 (갱단 카드에 연결된 불법 사업체 표시)
│   │   └── [id]/
│   │       ├── page.tsx        # 상세 (멤버, 운영 사업체, 관련 사건, 인라인 미니맵)
│   │       ├── OrgMiniMap.tsx      # Leaflet 인라인 미니맵 (거점·사업체 마커, SSR 제외)
│   │       └── OrgMiniMapWrapper.tsx  # Client Component 래퍼 (ssr:false dynamic import)
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
│       │   ├── page.tsx        # 조직 목록 (카테고리별 그룹, 각 행에 멤버 관리 링크)
│       │   ├── OrgEditRow.tsx  # 조직 인라인 편집/삭제 행
│       │   ├── OrgAddForm.tsx  # 조직 추가 폼
│       │   ├── actions.ts      # createOrganization, updateOrganization, deleteOrganization
│       │   └── [id]/           # 조직별 멤버 관리 페이지
│       │       ├── page.tsx        # 서버 컴포넌트 (org + members + 가용 캐릭터 fetch)
│       │       ├── MemberManageClient.tsx  # 멤버 추가·편집·퇴장·복귀 클라이언트 UI
│       │       └── actions.ts      # addOrgMembers, updateOrgMember, setMembersLeft, restoreMember
│       ├── events/             # 사건 CRUD + 참여자/클립 편집
│       ├── relationships/      # 캐릭터 관계 CRUD
│       ├── streamers/          # 스트리머 CRUD (display_name, chzzk_channel_id, profile_image_url, is_active)
│       ├── map/                # 거점 지도 관리 (90vh 전체 화면)
│       │   ├── page.tsx        # force-dynamic, 조직+주요 장소 fetch, 갱단 biz 좌표 병합
│       │   ├── AdminMapView.tsx  # 사이드바 탭 UI (조직 거점·사업체 / 주요 장소)
│       │   ├── AdminLeafletMap.tsx  # 어드민 전용 Leaflet 지도 (거점/사업체 모드 전환)
│       │   └── actions.ts      # updateOrgHq, updateOrgBiz, addMapLocation, updateMapLocation, deleteMapLocation
│       ├── reports/            # 제보 관리 (상태 필터, 상태 변경, IP 차단, 좌표 → 주요 장소 추가)
│       │   └── ReportCoordAction.tsx  # 좌표 제보 파싱 → 주요 장소 직접 추가 클라이언트 컴포넌트
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
│   │   ├── BackButton.tsx      # 이전 페이지로 돌아가기 (router.back(), iconOnly prop 지원)
│   │   ├── Select.tsx          # 커스텀 셀렉트
│   │   ├── button.tsx          # shadcn 버튼
│   │   ├── sheet.tsx           # shadcn Sheet (모바일 메뉴)
│   │   └── DropdownPortal.tsx
│   ├── streamers/
│   │   └── StreamerListWithLive.tsx  # 온라인/오프라인/비활동 분류 카드 리스트
│   ├── characters/
│   │   ├── CharacterFilters.tsx
│   │   └── CharactersClientSection.tsx  # 캐릭터 카드 그리드 (필터·정렬·빨간약 스트리머 섹션)
│   ├── events/
│   │   ├── TimelineView.tsx    # 연대표 (가로/세로 모드)
│   │   ├── TimelineFilters.tsx
│   │   ├── EventTypeFilter.tsx
│   │   ├── ClipLabel.tsx       # 클립 라벨 스트리머명↔캐릭터명 치환
│   │   └── ClipPlayer.tsx      # 클립 인라인 플레이어 (Chzzk/YouTube iframe, 플레이리스트, 툴팁)
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
- **좌표 저장 규칙**: `hq_x/hq_y` = 조직 거점 (GTA X/Y축), `biz_x/biz_y` = 불법 사업체 위치
- **마커 종류**:
  - 조직 거점: SVG 드롭핀 (teardrop) + 글로우 — `createDropIcon(color, selected)`
  - 불법 사업체: SVG 다이아몬드 + 글로우 — `createBizIcon(color, selected)`
  - 주요 장소: SVG 원형 + 글로우·외곽 링 — `createLocationIcon(color, selected)`
- **갱단 불법 사업체 biz 마커**: `organizations.biz_x/biz_y` 수동 설정이 우선, 없으면 `gang_id`로 연결된 illegal org의 `hq_x/hq_y`를 자동 사용 (page.tsx 서버단 병합)
- Leaflet 컴포넌트는 항상 `'use client'` 래퍼 안에서 `dynamic(() => import(...), { ssr: false })`로 로드
  - Server Component에서 직접 `dynamic(..., { ssr: false })` 불가 — Client Component 래퍼 필요
- 공개 지도 팝업: 선택한 핀 위 Leaflet Popup (지도 이동 따라감, Escape/빈 영역 클릭으로 닫기)
- 지도 필터 UX: "조직 위치" 그룹(토글+카테고리 서브필터) / "주요 장소" 그룹(토글+라벨 서브필터) — `invisible`로 레이아웃 고정
- 어드민 지도: 사이드바 상단 거점/사업체 모드 탭 → 클릭으로 좌표 찍기 → 저장 패널 → Server Action + revalidatePath
- 조직 상세 `/organizations/[id]`에 인라인 미니맵 표시 (거점+사업체 마커, Atlas 고정)
- `/map?org=<ID>`로 이동하면 해당 핀 자동 선택·확대

### 클립 플레이어 (`ClipPlayer.tsx`)
- Chzzk URL `https://chzzk.naver.com/clips/{id}` → embed `https://chzzk.naver.com/embed/clip/{id}`
- YouTube `watch?v=`, `youtu.be/`, `shorts/` → `https://www.youtube.com/embed/{id}`
- 모든 클립 iframe을 최초 렌더 시 미리 로드, `visibility: hidden/visible`로 전환 — 클립 전환 시 딜레이 없음
- YouTube 백그라운드 iframe은 `autoplay` 없이 프리로드 (동시 재생 방지)
- 플레이리스트: 좌우 버튼 내비게이션 (끝 도달 시 버튼 `opacity-0`), `scrollBy(clientWidth)` 단위 이동
- 툴팁: `overflow-x: scroll` 클리핑 우회를 위해 `getBoundingClientRect` + `fixed` 포지션으로 렌더링

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
| `organization_members` | 캐릭터↔조직 N:M (role, is_primary, joined_at, left_at, sort_order) |
| `organizations` | 조직 (category, color, hq_x, hq_y, hq_label, biz_x, biz_y, biz_label, gang_id, is_active, is_disbanded) |
| `map_locations` | 주요 장소 핀 (name, label, description, color, x, y) |
| `events` | 사건 아카이브 (type, occurred_at, is_published) |
| `event_participants` | 사건↔캐릭터 N:M (role, sort_order) |
| `event_clips` | 사건 클립 (clip_url, label, streamer_id, sort_order) |
| `character_relationships` | 캐릭터 관계 (type: friend/enemy/rival/family/romantic/ally/mentor/colleague/neutral) |
| `reports` | 제보 (type, status: pending/reviewing/applied/rejected, ip) |
| `blocked_ips` | 차단 IP 목록 (ip, reason) |

### 마이그레이션 파일 (supabase/migrations/)
| 파일 | 내용 |
|---|---|
| 001~009 | 초기 스키마, 조직 카테고리, 연락처, 해산, 원자적 저장, IP 신고·차단 |
| `010_org_hq.sql` | organizations 테이블에 hq_x, hq_y, hq_label 컬럼 추가 |
| `011_map_locations.sql` | map_locations 테이블 생성 (RLS 포함) |
| `013_org_business_location.sql` | organizations 테이블에 biz_x, biz_y, biz_label 컬럼 추가 |
| `014_member_sort_order.sql` | organization_members 테이블에 sort_order 컬럼 추가 |
| `015_event_sort_orders.sql` | event_participants 테이블에 sort_order 컬럼 추가 |
| `016_relationship_add_colleague.sql` | character_relationships CHECK 제약에 'colleague' 추가 |

---

## 구현 완료 기능

### 공개 페이지
- [x] 홈 — 통계, 최근 사건, 빠른 링크 (라이브 섹션은 LIVE_ENABLED 조건부)
- [x] `/live` — 온라인/오프라인 실시간 분류, 조직 필터 (현재 임시 중단 안내)
- [x] `/streamers` — 목록 (라이브 확인 없이 디렉토리 형태)
- [x] `/streamers/[id]` — 스트리머 상세
- [x] `/characters` — 목록 + 필터 (빨간약 ON 시 카드 우상단에 스트리머 프로필·치지직 바로가기 표시)
- [x] `/characters/[id]` — 상세 (소속 조직, 인물 관계, 참여 사건, 소속 조직 거점 인라인 미니맵)
- [x] `/organizations` — 목록 (갱단/공무직/사업체 등, 갱단 카드에 연결된 불법 사업체 표시)
- [x] `/organizations/[id]` — 상세 (멤버, 운영 사업체, 관련 사건, 인라인 미니맵)
- [x] `/map` — GTA V 거점 지도 (조직 드롭핀·사업체 다이아몬드·주요 장소 원형 마커, Atlas/위성 전환, 그룹 필터 UI)
- [x] `/events` — 목록 + 타입 필터
- [x] `/events/[id]` — 상세 (참여자 sort_order 정렬, 클립 인라인 임베드 플레이어)
- [x] `/events/timeline` — 연대표 (가로/세로, 캐릭터/조직/전체 필터)
- [x] `/search` — 통합 검색 (캐릭터/스트리머/사건/조직, 조직·사건 확장 카드)
- [x] `/schedule`, `/guide`, `/report` — 일정, 가이드, 제보 폼 (지도 핀 위치 첨부 기능 포함)

### 어드민 (`/admin/*`)
- [x] 대시보드 — 통계, 미정 캐릭터·미처리 제보 바로가기
- [x] 캐릭터/조직/사건/관계 CRUD (캐릭터 RP명 인라인 수정, 조직 불법 사업체 gang_id 연결)
- [x] 사건 인라인 삭제 (2단계 확인)
- [x] 스트리머 관리 — 추가/수정/삭제, 치지직 채널 ID·프로필 이미지 관리
- [x] 거점 지도 관리 — 조직 거점/사업체 모드 탭, 클릭 배치, 주요 장소 추가/수정/이동/삭제
- [x] 제보 관리 — 상태·유형 필터(동시 적용 가능), 상태 변경, IP 차단 버튼, 좌표 제보 시 주요 장소 직접 추가
- [x] IP 차단 관리 — 차단 목록 확인, 차단 해제
- [x] 조직 멤버 일괄 편집 (`/admin/organizations/[id]`) — 멤버 다중 추가(검색→대기열→일괄 추가), 역할·주소속 인라인 편집, 체크박스 일괄 퇴장, 이전 멤버 복귀, 드래그 앤 드롭 순서 조정
- [x] Vercel Analytics + Speed Insights 연동 (`@vercel/analytics/next`, `@vercel/speed-insights/next`)
- [x] 사건 편집 — 참여 캐릭터·클립 드래그 앤 드롭 순서 조정 + 순서 저장

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
| `0f89db4` | 전체 상세 페이지 뒤로가기 버튼 → router.back() 통일 (BackButton 컴포넌트) |
| `69fb30c` | 캐릭터 카드: 빨간약 ON 시 스트리머 프로필·치지직 바로가기 (우상단 absolute 배치) |
| `a52cc3c` | 캐릭터·스트리머 상세 뒤로가기 → router.back() |
| `dfee92a` | 인물 관계 타입 '동료(colleague)' 추가 + 마이그레이션 016 |
| `8bcd5bb` | 어드민 스트리머 액션 버튼 잘림 수정 (colgroup inline style, w-12→11rem) |
| `0a3e5dd` | 404 페이지: 경로별 컨텍스트 버튼 (characters/organizations/events 등) |
| `aa35cf6` | feat/clip-embed 머지: 클립 임베드 플레이어 + 사건 편집 순서 조정 |
| `ec4eefa` | 조직 멤버 순서 직접 설정 (sort_order 컬럼, 어드민 드래그 앤 드롭 UI) |
| `0221fd9` | Vercel Analytics + Speed Insights 연동 |
| `afdec1b` | 캐릭터 상세 페이지: 소속 조직 거점 미니맵 추가 |
| `38b29fb` | 어드민 제보 관리: 유형별 필터 추가 (상태·유형 동시 적용, 서버사이드 필터링) |
| `1ac8b6b` | 어드민 조직 멤버 일괄 편집 — 다중 추가·인라인 편집·일괄 퇴장·복귀 |
| `1e58b9f` | 조직 상세 페이지에 Leaflet 인라인 미니맵 추가 (거점·사업체 마커, 전체 지도 이동 버튼) |
| `3f4ec2d` | 지도: gang_id 연결된 불법 사업체 org 좌표를 갱단 biz 마커로 자동 표시 |
| `5172f30` | 조직 불법 사업체 위치 기능 추가 (biz_x/biz_y/biz_label 컬럼, 어드민 편집) |
