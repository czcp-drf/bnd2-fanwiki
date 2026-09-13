# 봉누도2 위키 — 프로젝트 가이드

> AI 에이전트(Claude Code, Codex 등)가 공통으로 참조하는 프로젝트 지식 문서입니다.
> 기능을 추가하거나 구조를 변경할 때 이 파일도 함께 업데이트해 주세요.

---

## 개요

GTA RP 서버 "봉누도2"의 팬 위키 사이트.
스트리머, 캐릭터, 조직, 사건 아카이브를 제공하며 **빨간약 토글**로 스트리머 정보 공개 여부를 제어합니다.

### 운영진 논의 현황: 방향·기능 범위 검토 대기

- 사용자와 봉누도2 운영진의 대화에 따르면 운영진은 공식 위키를 준비 중입니다. 운영진으로부터 현 페이지에 인게임 기사·SNS 같은 콘텐츠를 함께 올리는 **‘봉누도 따라가기’** 컨셉으로 발전시키고 싶다는 의향을 전달받았습니다.
- ‘봉누도 따라가기’는 논의 중인 컨셉이며 아직 구체적인 내용이나 개발 범위가 나온 상태는 아닙니다.
- 공식 위키와 포지션이 겹치는 부분은 제거해야 할 필요성이 있을 수 있습니다. 운영진은 중복되는 부분과 조정 필요 여부를 확인한 뒤 사용자에게 알려주겠다고 답변한 상태입니다.
- 현재는 운영진의 검토 결과를 기다립니다. 기존 캐릭터·조직·지도·사건 기능을 유지·확장하기로 확정하거나, 특정 기능을 제거하기로 확정한 상태가 아닙니다. 회신과 사용자 지시 전에는 이 논의를 근거로 기능을 추가·삭제·재편하지 않습니다.
- 이는 전달받은 개발 방향이며, 현재 사이트가 공식 위키이거나 공식 서비스로 승인되었다는 의미는 아닙니다. 현재 구현은 기존 팬 위키 구조를 유지합니다.
- 기사·SNS의 수집/등록 방식, 작성 주체와 출처 표기, 게시 권한·검수, 화면 구성, 기존 기능 유지 범위, 서비스명 변경 및 구현 일정은 아직 정하지 않았습니다. 자동 수집이나 새 게시 기능을 구현하기로 확정한 상태도 아닙니다.
- 운영진 논의와 별개로 사용자가 인게임 SNS `Bongstagram`의 단계적 구현을 시작하도록 요청했습니다. 1단계는 임시 `feat/bonstagram` 브랜치에서 기존 캐릭터와 1:1로 연결되는 계정 구조와 기본 피드 화면을 구성하며, 릴스 기능은 범위에서 제외합니다. 실제 게시·팔로우·가입 연동은 후속 단계에서 확정합니다.

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
│   ├── bongstagram/page.tsx    # Bongstagram 기본 피드 화면 (1단계)
│   ├── bbs/                    # BBS 반응형 메인·기사 상세 화면 (Supabase 공개 기사 연동)
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
│       │       ├── MemberManageClient.tsx  # 멤버 추가·편집·탈퇴·복귀 클라이언트 UI
│       │       └── actions.ts      # addOrgMembers, updateOrgMember, setMembersLeft, restoreMember
│       ├── events/             # 사건 CRUD + 참여자/클립 편집
│       ├── relationships/      # 캐릭터 관계 CRUD
│       ├── streamers/          # 스트리머 CRUD (display_name, chzzk_channel_id, profile_image_url, is_active)
│       ├── bongstagram/        # Bongstagram 프로필·게시물 등록·수정·삭제
│       │   └── posts/page.tsx  # Bongstagram 게시물·스토리 관리
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
| `bongstagram_profiles` | 기존 `characters`와 1:1로 연결되는 Bongstagram 표시 닉네임 |
| `bongstagram_posts` | Bongstagram 게시물·스토리 본체 (character_id, post_type, content, posted_at, story_expires_at) |
| `bongstagram_post_media` | 게시물 미디어 (image/video URL, Storage 경로, sort_order) |
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
| `017_atomic_creation.sql` | 캐릭터·스트리머와 연결 데이터 원자적 생성 RPC 추가 |
| `018_bonstagram_profiles.sql` | 기존 캐릭터와 1:1 연결되는 Bongstagram 프로필 테이블 생성 |
| `019_rename_bongstagram.sql` | 적용된 018의 테이블·제약조건·트리거·RLS 정책명을 Bongstagram으로 변경 |
| `020_bongstagram_posts.sql` | Bongstagram 기본 게시물 테이블 생성 (RLS 포함) |
| `021_bongstagram_media.sql` | 게시물·스토리 타입과 이미지·동영상 다중 미디어 테이블 추가, 기존 image_url 이관 |
| `022_bongstagram_storage.sql` | Bongstagram 직접 업로드용 Storage 버킷과 미디어 storage_path 추가 |
| `023_bongstagram_interactions.sql` | 게시물별 IP 제한 좋아요와 관리자 전용 댓글 테이블 추가 |
| `024_bongstagram_comment_replies.sql` | 댓글 작성 시간 관리와 1단계 답글용 parent_comment_id 추가 |
| `025_bongstagram_comment_author.sql` | 댓글 작성자 캐릭터 연결과 기존 프로필명 기반 데이터 보정 |

---

## 구현 완료 기능

### 공개 페이지
- [x] 홈 — 통계, 최근 사건, 빠른 링크 (라이브 섹션은 LIVE_ENABLED 조건부)
- [x] `/live` — 온라인/오프라인 실시간 분류, 조직 필터 (현재 임시 중단 안내)
- [x] `/streamers` — 목록 (라이브 확인 없이 디렉토리 형태)
- [x] `/streamers/[id]` — 스트리머 상세
- [x] `/characters` — 목록 + 필터 (빨간약 ON 시 카드 우상단에 스트리머 프로필·치지직 바로가기, 조직 뱃지 우측에 직책 인라인 표시, 가이드 뱃지)
- [x] `/characters/[id]` — 상세 (소속 조직, 인물 관계, 참여 사건, 소속 조직 거점 인라인 미니맵, 가이드 뱃지)
- [x] `/organizations` — 목록 (갱단/공무직/사업체 등, 갱단 카드에 연결된 불법 사업체 표시)
- [x] `/organizations/[id]` — 상세 (멤버카드에 소속 조직명·직책·가이드 뱃지, 운영 사업체, 관련 사건, 인라인 미니맵)
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
- [x] 조직 멤버 일괄 편집 (`/admin/organizations/[id]`) — 멤버 다중 추가(검색→대기열→일괄 추가), 역할·주소속 인라인 편집, 체크박스 일괄 탈퇴, 이전 멤버 복귀, 드래그 앤 드롭 순서 조정, 칼럼 헤더 정렬(정렬 상태에서 드래그 가능)
- [x] Vercel Analytics + Speed Insights 연동 (`@vercel/analytics/next`, `@vercel/speed-insights/next`)
- [x] 사건 편집 — 참여 캐릭터·클립 드래그 앤 드롭 순서 조정 + 순서 저장
- [x] 캐릭터 추가 — 어드민 캐릭터 관리 페이지에서 스트리머 연결 없이 직접 추가 가능
- [x] 스트리머 추가 시 '미정' 캐릭터 자동 생성·연결

### Bongstagram (임시 브랜치 작업 중)
- [x] `/bongstagram` Instagram 스타일 모바일 피드 레이아웃과 Bongstagram 프로필 안내 UI
- [x] 글로벌 네비게이션의 Bongstagram 다크/라이트 테마 토글 (Bongstagram 외 페이지에서는 비활성화)과 브라우저 저장
- [x] `bongstagram_profiles` 1:1 계정 테이블·프로필 이름 제약 마이그레이션 작성 (`018_bonstagram_profiles.sql`, `019_rename_bongstagram.sql`)
- [x] 기존 캐릭터 선택 기반의 Bongstagram 프로필 등록/수정/삭제 화면 (`/admin/bongstagram`)
- [x] 관리자 캐릭터 선택 드롭다운 텍스트 검색, 조직 필터, Bongstagram 연결 상태 3단계 필터와 미연결 캐릭터 행의 프로필 수정
- [x] Bongstagram 게시물·스토리 등록·수정·삭제 관리자 화면과 공개 피드 연결 (이미지·동영상 여러 개, `/admin/bongstagram/posts`)
- [x] 관리자 게시물 작성 시 Supabase Storage 직접 업로드 (이미지 10MB·동영상 100MB, 일회성 업로드 URL, 파일 삭제 시 Storage 정리)
- [ ] 게시물 상세 페이지
- [x] 피드 좋아요 — IP 해시 기준 게시물별 1회 등록·취소
- [x] 좋아요 요청 속도 제한 — IP 해시 기준 게시물·스토리 통합 1초 제한 (`028_bongstagram_like_rate_limit.sql`)
- [x] 좋아요 비상 전환 — `BONGSTAGRAM_LIKES_MODE=server`(기본) 또는 `local`로 게시물·스토리 좋아요 저장 방식을 전환하며, local 모드에서는 서버 쓰기·방문자별 DB 조회·주기 집계를 중단하고 브라우저 localStorage만 사용
- [x] 피드 댓글 조회창 — 공개 조회만 지원하며 공개 작성은 차단
- [x] 관리자 댓글 등록·수정·삭제 및 작성 시간 지정, 게시물별 직접 댓글 관리와 1단계 답글 등록 (`/admin/bongstagram/posts`)
- [x] 댓글창 빨간약 표시 — Bongstagram 프로필과 연결된 댓글 작성자의 이름·프로필 이미지를 토글 상태에 따라 표시
- [x] 하단 네비게이션 연결 — 홈·Bongstagram 검색·내 프로필, 만들기 버튼 비활성화 및 현재 페이지 강조
- [x] 로컬 팔로우 — 팔로우 목록을 브라우저에 저장하고 내 프로필에서 팔로잉 수·검색·해제·재팔로우 지원, 새로고침 시 팔로우 우선 피드와 비팔로우 게시물 일부 랜덤 삽입
- [x] 인스타그램형 프로필 — 다른 사람 프로필과 내 프로필의 통계·소개·스토리 하이라이트·콘텐츠 탭·게시물 그리드 구성
- [x] 공개 제보 보호 — 참고 링크는 `http/https`만 허용하고, IP 해시 기준 30초 제출 제한과 클라이언트 카운트다운을 적용 (`029_report_rate_limit.sql`)
- [ ] 릴스 기능 — 범위에서 제외

### BBS (Bongnudo Broadcasting System)
- [x] 반응형 BBS 메인·기사 상세 화면 (`/bbs`, `/bbs/article/[id]`) — 모바일 하단 카테고리 고정, 데스크톱 가로 카테고리 메뉴
- [x] 기존 글로벌 라이트·다크 테마 토글 연동 — BBS에서도 헤더 토글을 활성화하고 Bongstagram과 테마 상태를 공유
- [x] 라이브 방송 기능 제외 — BBS는 인게임 기사 시스템으로만 구성
- [x] BBS 기사 기본 스키마 migration 작성 (`030_bss_articles.sql`) — 제목, 카테고리, 요약·본문, 대표 이미지, 승인일시, 공개 여부, 담당기자 캐릭터 연결
- [x] BBS 기사 migration 운영 DB 적용 (`030_bss_articles.sql`, 사용자 확인)
- [x] BBS 기사 첨부 이미지 스키마 migration 작성 (`031_bss_article_media.sql`) — 기사당 이미지 최대 5장, 순서 지정
- [x] BBS 기사 첨부 이미지 migration 운영 DB 적용 (`031_bss_article_media.sql`, 사용자 확인)
- [x] BBS 기사 승인일시 migration 작성 (`032_bss_article_approval.sql`) — 기존 `published_at`을 `approved_at`으로 변경하고 공개 시 승인일시 필수
- [x] BBS 기사 승인일시 migration 운영 DB 적용 (`032_bss_article_approval.sql`, 사용자 확인)
- [x] BBS 기사 좋아요·싫어요·댓글 스키마 migration 작성 (`033_bss_article_interactions.sql`) — 기사당 IP별 반응 1개, 관리자 댓글 조회 구조
- [x] BBS 기사 상호작용 migration 운영 DB 적용 (`033_bss_article_interactions.sql`, 사용자 확인)
- [x] BBS 기사 어드민 등록/수정/삭제 (`/admin/bbs`) — 기사 검색·말머리/공개 상태 필터, 활성 언론 조직 소속 담당기자 선택, KST 승인일시, 대표/첨부 이미지 최대 5장 관리
- [x] BBS 기사 이미지 Storage migration 운영 DB 적용 (`034_bss_storage.sql`, 사용자 확인)
- [x] BBS 기사 DB 식별자 rename migration 운영 DB 적용 (`035_rename_bss_tables_to_bbs.sql`, 사용자 확인)
- [x] 이미지 전송 최적화 기반 — Supabase Storage 이미지는 Vercel `next/image` 최적화·캐시 사용, 동영상·외부 이미지는 기존 전달 방식 유지

---

## 환경변수

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 서비스 롤 key (어드민, 업로드 스크립트) |
| `BONGSTAGRAM_SERVER_FINAL_DATE` | 서버 마지막 종료일 (`YYYY-MM-DD`, 해당일 오전 3시에 스토리 전체 종료) |
| `BONGSTAGRAM_LIKES_MODE` | 좋아요 저장 모드 (`server` 기본값, `local`은 브라우저 localStorage만 사용) |
| `BBS_REACTIONS_MODE` | BBS 좋아요·싫어요 저장 모드 (`local` 기본값, `server` 설정 시 IP 해시 DB 저장) |
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
- 이미지는 `AppImage` 컴포넌트 사용 (Supabase Storage 이미지는 Vercel 최적화·캐시, 외부 이미지는 `unoptimized` 유지)
- Leaflet 컴포넌트는 반드시 `dynamic(() => import(...), { ssr: false })`로 로드
- 어드민 Server Action 후 `revalidatePath('/admin/...')` + 관련 공개 경로도 함께 무효화

---

## 알려진 패턴 / 주의사항

### Supabase 중첩 쿼리 한계
- `streamers → characters → organization_members → organizations` 등 **4단계 이상 중첩 쿼리**는 Supabase PostgREST에서 하위 데이터를 빈 배열로 반환하는 버그가 있음
- 해결책: 중간 테이블(예: `organization_members`)을 **별도 쿼리**로 분리하고 character_id로 매핑
- 적용 사례: `streamers/page.tsx`, `streamers/[id]/page.tsx`

---

## 최근 작업 기록

- BBS 기자 빨간약 표시 및 필터 위치 보완 (`feat/bss`, 커밋 및 원격 푸시): PC 기자 필터 패널을 필터 버튼의 좌측 끝 기준으로 배치하고, 화면 폭이 부족하면 뷰포트 안쪽으로 자동 이동하도록 수정했습니다. 기자 필터 목록과 기사 카드·상세페이지의 담당기자명을 빨간약 상태에 따라 캐릭터명 또는 스트리머명으로 표시하도록 연결했으며, `streamer_id`를 직접 조회해 스트리머명이 누락되지 않도록 데이터 매핑과 캐시 키를 보완했습니다. BBS 댓글에도 캐릭터·스트리머 이름과 이미지를 빨간약 상태에 따라 표시합니다. 어드민 댓글 수정·삭제와 작성 시간(KST) 수정 기능도 추가했습니다. ESLint·TypeScript·프로덕션 빌드·`git diff --check`를 통과했으며 대상 브랜치 `feat/bss`, 원격 `deploy/feat/bss`로 푸시합니다.

- BBS 어드민 댓글 작성·기사 필터 및 이미지 확대 보완 (`feat/bss`, 커밋 및 원격 푸시): 기사 목록에서 기사별 댓글을 펼쳐 DB에 등록된 캐릭터를 검색·선택해 댓글을 작성할 수 있도록 연결하고, 선택한 캐릭터 ID와 현재 이름을 저장하도록 했습니다. 기사 관리에 담당기자 필터와 승인일시 최신순·오래된순·제목순 정렬을 추가했으며, 새 기사 등록 폼에도 상단 닫기와 하단 취소를 제공했습니다. 기사 상세 대표 이미지와 추가 이미지의 확대 모달을 `body` 포털로 표시해 대표 이미지가 뒤 미디어 아래에 깔리지 않도록 수정했습니다. ESLint·TypeScript·`git diff --check`를 통과했으며 대상 브랜치 `feat/bss`, 원격 `deploy/feat/bss`로 푸시합니다.

- BBS 메인 필터·레이아웃 및 이미지 안정화 (`feat/bss`, 커밋 및 원격 푸시): 활성 언론 조직에 소속된 모든 기자를 다중 선택해 기사 목록을 필터링하도록 연결하고, 카테고리·기자 조건을 유지하는 12개 단위 페이지네이션을 추가했습니다. 모바일·PC BBS 영역과 기사 목록의 스크롤 UI는 숨기면서 동작은 유지하고, 하단 카테고리 네비게이션은 화면에 고정했습니다. 모바일 BBS 헤더도 상단에 고정했으며 전역 헤더의 실제 높이를 `3.5rem`으로 맞춰 내용이 적을 때 발생하던 불필요한 세로 스크롤을 보정했습니다. 정보·기타 카테고리 아이콘을 메가폰·달력으로 변경하고, 알림 기능은 준비 중 잠금 상태로 전환했습니다. 어드민 기사 폼에서는 요약 입력을 제거했으며 기존 요약 데이터는 수정 시 보존합니다. BBS 이미지 수정 시 기존 Storage 객체가 삭제되던 경로 비교 오류를 수정하고, 이미지 최적화 요청 실패 시 원본 URL로 재시도하도록 보완했습니다. ESLint·TypeScript·프로덕션 빌드·`git diff --check`를 통과했으며 대상 브랜치 `feat/bss`, 원격 `deploy/feat/bss`로 푸시합니다.

- BBS 공개 기사·상세페이지 및 반응 UI (`feat/bss`): 공개 기사 목록과 상세페이지를 `bbs_articles`·`bbs_article_media` 실데이터와 연결하고, 승인일시 기준 기사 카드와 `16:9` 대표 이미지 영역을 적용했습니다. 기사 상세 상단은 제목·담당기자·승인일시만 표시하며, 하단에는 우측 정렬 좋아요·싫어요·댓글·공유 버튼을 배치했습니다. 좋아요·싫어요는 `BBS_REACTIONS_MODE`가 `local`이면 브라우저별로만 저장하고 Supabase 반응 테이블을 조회·변경하지 않으며, 댓글 수·관리자 등록 댓글은 계속 조회합니다. 공유 버튼은 기사 URL을 클립보드에 복사하고 toast를 표시합니다. BBS 리본 아이콘은 좌측 상단·우측 하단 접힘과 대칭 명암, `NEWS` 라벨을 반영했으며 메인·상세 헤더에서 동일한 크기와 Geist Sans 폰트를 사용합니다. Bongstagram도 local 좋아요 모드에서 좋아요 수 조회까지 건너뛰도록 보완했습니다. `BBS_REACTIONS_MODE`의 기본값은 `local`이며 `server`로 전환하면 기존 IP 해시 반응 저장을 사용할 수 있습니다. 변경 파일 ESLint·TypeScript·프로덕션 빌드·`git diff --check`를 통과했고, `feat/bss`에서 원격 `deploy/feat/bss` 푸시 완료를 확인했습니다.

- Bongstagram 빈 화면 세로 스크롤 수정 (`feat/bss`, 커밋 대기): 전역 헤더 아래 페이지가 `min-h-screen`으로 다시 전체 뷰포트 높이를 차지하던 구조를 헤더 제외 높이 기준으로 조정했습니다. 검색·프로필·내 프로필·게시물 상세·해시태그·로딩 화면에 동일한 레이아웃 기준을 적용해 콘텐츠가 없을 때 불필요한 세로 스크롤이 생기지 않도록 했습니다. 변경 파일 ESLint·TypeScript 검사·`git diff --check`를 통과했습니다.

- 이미지 전송 최적화 기반 (`feat/bss`, 커밋 대기): Supabase Storage 이미지에만 Vercel `next/image` 최적화와 24시간 이상 캐시를 적용하도록 `AppImage`와 `next.config.ts`를 정리했습니다. 외부 이미지와 동영상은 기존 직접 전달을 유지하며, 이미지 URL의 `fill`·크기 속성 충돌 없이 반응형 `sizes`를 사용합니다. 변경 파일 ESLint·TypeScript 검사·`git diff --check`를 통과했습니다.

- BBS 반응형 초기 화면 및 테마 정리 (`feat/bss`): `public/bbs`의 모바일 참고 화면을 기준으로 BBS 메인·기사 상세 라우트를 추가했습니다. 모바일에서는 기사 카드·하단 고정 카테고리 메뉴를 사용하고, 데스크톱에서는 중앙 콘텐츠와 가로 카테고리 메뉴로 확장합니다. BBS는 기존 글로벌 Bongstagram 라이트·다크 테마 토글과 상태를 공유하며, 라이브 방송 기능은 인게임 시스템 범위에서 제외했습니다. 두 서비스의 다크모드 페이지 배경은 BBS 기준 색상 `#101216`으로 통일했습니다. Bongstagram 스토리 뷰어의 다크모드 외부 배경 오버레이 불투명도는 `72%`로 조정했습니다. 기사는 이후 Supabase·어드민 기능을 연결할 수 있도록 별도 데이터 타입과 샘플 데이터로 분리했습니다. 글로벌 헤더에 BBS 링크와 not-found 복귀 경로를 추가했습니다. 변경 파일 ESLint·TypeScript 검사·프로덕션 빌드·`git diff --check`를 통과했으며 `feat/bss` 커밋·원격 푸시를 완료했습니다.

- BBS 기사 스키마 적용 (`feat/bss`, migration 030 운영 DB 적용 완료): 초기 migration에서 생성된 기사 테이블은 이후 035에서 `bbs_articles`로 변경되었습니다.  제목, 안정적인 카테고리 키(`info`, `incident`, `economy`, `column`, `other`), 요약·본문, 대표 이미지 URL, KST 기준 승인일시, 공개 여부를 저장하도록 했습니다. 담당기자는 `characters.id` 외래키로 연결해 기사 조회 시 DB의 현재 캐릭터명을 사용하도록 설계했으며, 공개 읽기는 `is_published = true`인 기사만 허용합니다. 공개 처리 시 승인일시가 필수이고, 미승인 기사는 승인일시를 비워둘 수 있습니다. 사용자가 `030_bss_articles.sql`의 운영 DB 적용을 완료했습니다.
- BBS 기사 첨부 이미지 스키마 (`feat/bss`, migration 031 운영 DB 적용 완료): 초기 migration에서 생성된 첨부 이미지 테이블은 이후 035에서 `bbs_article_media`로 변경되었습니다.  기사당 첨부 이미지를 최대 5장까지 저장하고 `sort_order` 0~4로 순서를 관리하도록 했습니다. 대표이미지는 `bbs_articles.thumbnail_url`로 유지하며, 공개 기사에 연결된 이미지 파일만 공개 조회할 수 있습니다. 사용자가 `031_bss_article_media.sql`의 운영 DB 적용을 완료했습니다.

- BBS 기사 승인일시 및 상호작용 스키마 (`feat/bss`, migration 032·033 운영 DB 적용 완료): 이미 적용된 030을 직접 수정하지 않고 `032_bss_article_approval.sql`에서 `published_at`을 `approved_at`으로 변경하도록 분리했습니다. 미승인 기사는 승인일시를 비워둘 수 있고 공개 처리 시 승인일시가 필요합니다. `033_bss_article_interactions.sql`에는 기사별 좋아요·싫어요와 IP 해시 중복 제한, 관리자 관리형 댓글 및 공개 조회 정책을 추가했습니다. 사용자가 `032`, `033` migration의 운영 DB 적용을 완료했습니다.

- BBS 브랜드·경로·내부 식별자 통일 (`feat/bss`): 사용자에게 보이는 표기와 공개·관리자 경로를 BBS 기준(`/bbs`, `/admin/bbs`)으로 변경했습니다. 기존 DB 테이블·인덱스·FK·PK·unique 제약조건·트리거와 Storage 버킷 전환은 035 migration으로 완료했습니다.

- BBS DB 식별자 rename 적용 (`feat/bss`): 적용된 `bbs_articles`, `bbs_article_media`, `bbs_article_reactions`, `bbs_article_comments`를 `bbs_*`로 변경하고 자동 생성 FK·PK·unique 제약조건명까지 정리하는 `035_rename_bss_tables_to_bbs.sql`을 적용했습니다. 기존 `bss-media`가 비어 있는지 확인한 뒤 `bbs-media`를 생성했으며, Supabase Storage 보호 정책상 구버킷 삭제는 SQL이 아닌 Storage API 또는 대시보드에서 처리해야 합니다. 구버킷에 파일이 있으면 데이터 손실을 막기 위해 migration이 중단됩니다.

- BBS 명칭 전면 통일 (`feat/bss`, 원격 `deploy/feat/bss` 푸시 완료): 활성 라우트·내부 모듈·컴포넌트·스타일·참고 자산을 `bbs`/`Bbs` 기준으로 통일하고 폐기된 `/bss`, `/admin/bss` 호환 라우트를 제거했습니다. migration 이력 파일명은 Supabase 적용 이력 보존을 위해 유지했습니다. ESLint·TypeScript·프로덕션 빌드·`git diff --check`를 통과했습니다.

- BBS 기사 본문 서식 편집 (`feat/bss`): 어드민 기사 작성·수정 화면에 본문·제목 1~3(인게임 기준 제목 3이 최대)·굵게·기울임·취소선·점 목록·번호 목록 도구와 미리보기를 추가하고, 공개 상세 화면에서 Markdown 서식을 렌더링하도록 했습니다. 첨부 이미지 중 하나를 대표 이미지로 선택할 수 있어 동일 파일 재업로드를 줄였습니다. 기존 `content` 텍스트 컬럼을 사용하므로 추가 migration은 필요하지 않습니다.

- BBS 기사 관리 보완 (`feat/bss`, 원격 `deploy/feat/bss` 푸시): 담당기자는 활성 언론 조직(`organizations.type = 'journalist'`)의 현재 멤버만 선택하도록 제한했습니다. BBS 브랜딩 표기를 화면·관리자 메뉴·문서에 통일했고, 기사 본문 서식 도구와 Markdown 렌더링을 추가했습니다. 첨부 이미지 중 대표 이미지 선택을 지원하며, 기사 등록 중 수정 화면으로 전환할 때 입력 중인 내용이 사라진다는 경고 모달을 표시하고 확인 시 선택한 기사 정보를 새 폼으로 불러옵니다. `remark-gfm`을 추가했으며 ESLint·TypeScript·프로덕션 빌드를 통과했습니다.

- `feat/bonstagram` main 병합 완료: 좋아요 1초 제한, 제보 30초 제한과 클라이언트 제보 버튼 카운트다운, 공개 제보 참고 링크 URL 검증을 포함한 최신 기능을 `main`에 fast-forward 병합했습니다. 사용자가 migration 028·029의 Supabase 적용을 완료했으며, TypeScript·프로덕션 빌드·`git diff --check`를 통과했습니다. 대상 브랜치는 `main`, 원격은 `deploy/main`이며 문서 갱신 후 원격 푸시를 진행합니다.

- Bongstagram 관리자 화면 탭 전환 추가 (`54f9227`, `feat/bonstagram`): 게시물 관리 페이지 상단에 `게시물 관리`·`댓글 관리` 탭을 추가해 두 관리 영역을 한 번에 하나씩 표시하도록 구성했습니다. 서버에서 조회한 데이터와 기존 관리 기능은 유지하면서 긴 댓글 목록이 게시물 등록·목록 확인 영역을 밀어내지 않도록 화면을 분리했습니다. 기본 탭은 게시물 관리이며 탭 버튼에 tab 역할과 선택 상태를 적용했습니다. 변경 파일 검증을 통과했으며 원격 `deploy/feat/bonstagram`에 푸시 완료를 확인했습니다.

- Bongstagram 관리자 댓글 목록 개선 (`54f9227`, `feat/bonstagram`): 댓글 관리 목록을 접고 펼칠 수 있도록 했으며, 검색·게시물 필터 결과를 20개 단위로 페이지네이션합니다. 검색이나 필터를 변경하면 1페이지로 초기화하고, 삭제 후 마지막 페이지가 비어도 유효한 페이지 범위로 표시합니다. 변경 파일 ESLint·TypeScript 검사·`git diff --check`를 통과했으며 원격 `deploy/feat/bonstagram`에 푸시 완료를 확인했습니다.

- Bongstagram 기존 댓글 작성자 연결 정리 (`54f9227`, `feat/bonstagram`): 관리자 댓글 관리에 기존 댓글의 `author_character_id`와 Bongstagram 프로필명을 자동 대조하는 기능을 추가했습니다. 프로필명이 하나의 프로필과 일치하는 댓글만 캐릭터 ID·최신 프로필명으로 연결하고, 중복·불일치 댓글은 자동 변경하지 않으며 댓글 수정 화면에서 직접 프로필을 선택할 수 있도록 유지합니다. 자동 연결 전 미연결 개수와 처리 후 잔여 개수를 관리자 화면에서 확인할 수 있습니다. 변경 파일 ESLint·TypeScript 검사·`git diff --check`를 통과했으며 원격 `deploy/feat/bonstagram`에 푸시 완료를 확인했습니다.

- Bongstagram 댓글·미디어·스토리 UI 보완 (`1ef5ec8`, `feat/bonstagram`): 관리자 댓글·답글 등록 및 수정에서 임의 작성자명 입력을 제거하고 등록된 Bongstagram 프로필을 선택하도록 변경했습니다. 서버에서도 선택한 캐릭터의 Bongstagram 프로필을 확인해 표시명을 저장하며, 공개 댓글의 프로필 이미지와 이름은 해당 프로필로 이동하고 빨간약 상태에 따라 스트리머명·이미지를 전환합니다. 홈 네비게이션을 홈 화면에서 다시 누르면 피드 최상단으로 이동하도록 추가했으며, 기존 댓글도 프로필명으로 연결 가능한 경우 프로필 링크를 제공합니다. 피드와 게시물 상세의 다중 미디어에는 현재 순번·전체 개수 인디케이터를 미디어 아래 중앙에 표시하고, 게시물 시간은 댓글과 동일하게 `1분 미만 방금 전`·`N분 전`·`N시간 전`·`N월 M일` 순서로 표시합니다. 스토리 레일은 클릭 시 열람되면서 실제 드래그에서만 포인터 캡처가 동작하도록 보완했습니다. 변경 파일 ESLint·TypeScript 검사·`git diff --check`·프로덕션 빌드를 통과했으며, 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram`에 푸시 완료를 확인했습니다.

- Bongstagram 해시태그 탐색 추가 (`feat/bonstagram`): 피드와 게시물 상세 본문의 해시태그를 클릭 가능한 링크로 연결하고, `/bongstagram/hashtag/[태그]`에서 동일 태그가 포함된 게시물을 최신순 3열 그리드로 표시합니다. 이미지·동영상 게시물 그리드를 공용 컴포넌트로 통합했으며, 태그 비교는 대소문자를 구분하지 않습니다. 변경 파일 ESLint·프로덕션 빌드·`git diff --check`를 통과했으며, 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Bongstagram 스토리 공개·프로필 보정 (`feat/bonstagram`): 공개 스토리 뷰어에서는 좋아요 개수를 숨기고 좋아요 상태만 표시하도록 정리했으며, 좋아요 개수는 어드민 게시물 관리에서만 확인할 수 있도록 유지했습니다. 프로필 스토리는 24시간 이내 스토리만 현재 스토리 뷰어에 연결하고, 해당 스토리가 있으면 프로필 이미지에 메인 스토리 레일과 같은 그라데이션 테두리와 기본 아바타 배경을 표시합니다. 24시간 이상 지난 스토리 시간은 KST 기준 `N월 N일`로 표시합니다. 변경 파일 ESLint·TypeScript 검사·프로덕션 빌드·`git diff --check`를 통과했으며, 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Bongstagram 스토리 좋아요·어드민 정렬·시간대 통일 (`feat/bonstagram`): migration 026으로 스토리별 IP 해시 좋아요 테이블을 추가하고, 좋아요 등록·취소·개수 집계와 스토리당 IP 1회 제한을 구현했습니다. 좋아요한 스토리 ID는 브라우저 localStorage에도 저장하며 조회 기록과 DM·메시지 기능은 추가하지 않았습니다. 홈 및 프로필 보관함 스토리 뷰어에 좋아요 상태·개수를 연결하고, 어드민 게시물 관리에서 게시글·스토리 좋아요 수를 표시하며 좋아요 많은 순·적은 순 필터 정렬을 지원합니다. 게시물·스토리·댓글의 표시 시간과 관리자 입력 시간을 Asia/Seoul(KST) 기준으로 통일하고 새 게시물 입력 기본값도 KST로 설정했습니다. 사용자가 `026_bongstagram_story_likes.sql` 운영 DB 적용을 완료했습니다. 변경 파일 ESLint·TypeScript 검사·프로덕션 빌드·`git diff --check`를 통과했으며, 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Bongstagram 프로필 스토리 보관함 연결 (`feat/bonstagram`): 프로필의 날짜별 스토리 보관함 썸네일을 스토리 뷰어와 연결해 선택한 스토리부터 5초 자동 진행·좌우 이동·스와이프를 사용할 수 있도록 했습니다. 뷰어 재사용을 위해 스토리 미디어·슬라이드 타입과 뷰어를 공개 컴포넌트로 정리했으며, 팔로우 버튼 아래에 있던 단일 스토리 하이라이트 영역은 제거했습니다. 변경 파일 ESLint·프로덕션 빌드·`git diff --check`를 통과했습니다. 대상 브랜치는 `feat/bonstagram`이며 원격 `deploy/feat/bonstagram`에 커밋 후 푸시합니다.

- Bongstagram 스토리·검색 UI 보정 (`feat/bonstagram`): 스토리 뷰어의 상단 프로필 이미지·이름만 프로필 링크로 유지하고 시간은 `방금`·`N분`·`N시간` 형식의 일반 텍스트로 표시했습니다. `...` 버튼을 제거하고 닫기 버튼의 포인터 커서를 추가했으며, 미디어 상단 검정 그라데이션과 하단 메시지·좋아요·DM 액션 배치를 조정했습니다. 홈 스토리 레일은 업로드 시각 기준 24시간 동안만 노출하고, 만료된 스토리는 프로필 보관함에서 계속 확인할 수 있도록 분리했습니다. 검색 결과 유저 사이 구분선을 제거하고 테마별 호버 배경을 적용했으며, 라이트 모드 호버 색상은 `#F3F3F3`로 지정했습니다. `AppImage`의 `fill` 사용 시 width·height 충돌도 수정했습니다. 변경 파일 ESLint·TypeScript 검사·프로덕션 빌드·`git diff --check`를 통과했으며, 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Bongstagram 1단계 (`feat/bonstagram`): 기본 피드 페이지, 글로벌 메뉴, 캐릭터 1:1 프로필 타입과 마이그레이션 018을 추가했습니다. `profile_name`은 SNS에 표시되는 닉네임으로 사용하며 별도 username은 두지 않습니다. 운영 DB의 `bonstagram_profiles` 조회 성공과 등록 프로필 0개를 확인했습니다. 프로덕션 빌드는 통과했으며, 전체 린트는 기존 파일의 오류 6개·경고 8개로 실패했습니다. 이번 브랜치 커밋 후 원격 `deploy/feat/bonstagram`에 푸시합니다. Vercel 배포는 별도 확인 대상입니다.

- Bongstagram UI 보정 (`feat/bonstagram`): 참고 이미지에 맞춰 모바일 SNS 레이아웃의 로고 크기·가로 비율·고딕 폰트, 작성자 팔로우 버튼, 하단 홈·검색·만들기·프로필 네비게이션을 조정했습니다. 릴스·저장·더보기 버튼은 제외했으며, 홈은 출입구가 있는 채움형 아이콘, 만들기는 둥근 사각형 안의 `+` 아이콘으로 구성했습니다. 변경 파일 린트와 `git diff --check`를 통과했습니다. 이번 수정도 `deploy/feat/bonstagram`에 푸시합니다.

- Bongstagram 테마·브랜드 보정 (`feat/bonstagram`): 테마 토글을 글로벌 네비게이션의 빨간약 토글 우측으로 이동하고 Bongstagram에서만 활성화했습니다. `Bongstagram` 표기와 로고 비율을 통일했으며, 라이트·다크 호버 색상, 스토리 `+` 배지, 스토리 내부 회색 그라데이션 원을 조정했습니다. 관련 파일 린트와 프로덕션 빌드를 통과했으며 `git diff --check`를 확인했습니다. 이번 수정도 `deploy/feat/bonstagram`에 푸시합니다.

- Bongstagram 명칭 통일 (`feat/bonstagram`): 공개 라우트를 `/bongstagram`으로 변경하고 기존 `/bonstagram`은 호환 리다이렉트로 유지했습니다. 코드·타입·스키마 스냅샷·테마 식별자를 `bongstagram` 기준으로 정리했으며, 이미 적용된 018을 변경하지 않고 `019_rename_bongstagram.sql`에서 테이블·제약조건·트리거·RLS 정책을 rename하도록 작성했습니다. 019는 사용자가 운영 DB에 적용 완료했고, `bongstagram_profiles` 조회 성공 및 기존 테이블명 미노출을 확인했습니다.

- Bongstagram 관리자 필터 개선 (`72c5c83`): 캐릭터 선택과 조직 선택 드롭다운에 텍스트 검색을 추가하고, 조직별·무소속 캐릭터 필터와 Bongstagram 연결 상태 3단계(미연결자만·전체·연결자만) 필터를 추가했습니다. 미연결 캐릭터 행에서도 수정 버튼으로 프로필을 바로 연결할 수 있으며, 변경 파일 린트·`git diff --check`·프로덕션 빌드를 통과했습니다. `feat/bonstagram` 브랜치에 커밋합니다.

- Bongstagram 게시물 기반 추가: `020_bongstagram_posts.sql`과 `021_bongstagram_media.sql` 마이그레이션, 데이터베이스 타입, 관리자 게시물·스토리 등록·수정·삭제, 공개 최신순 피드를 추가했습니다. 게시물은 기존 Bongstagram 프로필이 연결된 캐릭터만 작성할 수 있고, 이미지·동영상 여러 개와 본문·게시일을 지원합니다. 스토리는 다음 서버 종료 오전 3시까지 표시되며 프로필에 한국 시간 기준 일자별로 보관됩니다. `BONGSTAGRAM_SERVER_FINAL_DATE` 지정 시 해당일 오전 3시에 모든 스토리를 종료합니다. 사용자가 021 적용을 완료했으며 관련 린트·`git diff --check`·프로덕션 빌드를 통과했습니다. 아직 커밋하지 않은 작업입니다.

- Bongstagram 관리자 메뉴 분리: 프로필 관리는 `/admin/bongstagram`, 게시물·스토리 등록 및 관리는 `/admin/bongstagram/posts`에서 별도로 접근하도록 구성했습니다. 아직 커밋하지 않은 작업입니다.

- Bongstagram 직접 미디어 업로드: 관리자 화면에서 Supabase Storage 일회성 업로드 URL로 이미지·동영상을 직접 전송하고 게시물 미디어에 Storage 경로를 저장하도록 추가했습니다. 이미지 10MB·동영상 100MB 제한, 지원 MIME 형식 검증, 게시물 삭제·수정 시 이전 Storage 파일 정리를 포함합니다. `022_bongstagram_storage.sql` 적용 후 버킷·컬럼과 실제 게시글 업로드를 확인했습니다. 린트·`git diff --check`·프로덕션 빌드를 통과했으며 아직 커밋하지 않은 작업입니다.

- Bongstagram 게시물 기능 커밋·푸시: 게시물·스토리 관리자 섹션, 다중 이미지·동영상, 예약 게시일, 스토리 보관·만료, Storage 직접 업로드를 `feat/bonstagram`에 커밋하고 `deploy/feat/bonstagram`으로 푸시했습니다. 운영 DB에서 migration 021·022와 실제 파일 업로드를 확인했으며, 변경 파일 린트·`git diff --check`·프로덕션 빌드를 통과했습니다. Vercel 배포 완료 여부는 별도 확인 대상입니다.

- Bongstagram 캡션·헤더 보정: 게시물 본문 앞에 클릭 가능한 프로필 이름을 볼드체로 표시하고, 공백·개행 단위 해시태그를 강조했습니다. 게시글 헤더에는 프로필 이미지와 프로필 이름만 표시하고 팔로우 버튼을 우측에 유지했습니다. 변경 파일 린트와 `git diff --check`를 통과했으며 `feat/bonstagram`에 커밋·푸시합니다.

- Bongstagram 미디어 UI 개선: 고정 피드 프레임과 검정 레터박스, 화면 노출 기반 영상 자동 재생·일시정지, 전체 피드 음소거 상태 공유, 커스텀 재생 버튼, 다중 미디어 좌우 버튼·모바일 스와이프·PC 드래그를 추가했습니다. 업로드 시간·좋아요·댓글 표시 영역과 하단 고정 네비게이션도 반영했습니다. 린트와 프로덕션 빌드를 통과했으며 `feat/bonstagram`에 커밋·푸시합니다.

- Bongstagram 어드민 필터 추가: 게시물 관리에서 프로필·캐릭터·본문 검색, 조직·무소속, 게시글·스토리, 이미지·동영상 필터와 최신·오래된 게시일 정렬을 지원합니다. 현재 조직 소속 데이터를 기준으로 조직 필터를 구성했으며 린트·프로덕션 빌드·`git diff --check`를 통과했습니다. `feat/bonstagram`에 커밋·푸시합니다.

- Bongstagram 빨간약 표시 연동: 빨간약 ON에서는 스트리머명과 스트리머 프로필 이미지를 우선 표시하고, OFF에서는 Bongstagram 프로필명과 프로필 이미지를 표시하도록 피드 헤더·본문 작성자명·스토리에 적용했습니다. 스트리머 이미지가 없으면 기존 Bongstagram 이미지 또는 캐릭터 이미지로 대체합니다. 변경 파일 린트·TypeScript 검사·프로덕션 빌드·`git diff --check`를 통과했으며 `feat/bonstagram`에 커밋하고 `deploy/feat/bonstagram`에 푸시합니다.

- Bongstagram 좋아요·댓글 추가: migration 023으로 게시물별 좋아요와 댓글 테이블을 추가했습니다. 좋아요는 원본 IP를 저장하지 않고 서버 해시와 게시물별 유니크 제약으로 IP당 1회 등록·취소를 처리하며, 댓글은 공개 조회만 제공하고 작성은 관리자 영역으로 제한했습니다. 피드에 좋아요 수·현재 IP 상태·댓글 수와 댓글 조회창을 연결했습니다. localhost에서 브라우저별 IPv4·IPv6 및 프록시 헤더 차이를 줄이도록 IP 정규화를 추가했습니다. 변경 파일 린트·TypeScript 검사·프로덕션 빌드·`git diff --check`를 통과했으며 `feat/bonstagram`에 커밋하고 `deploy/feat/bonstagram`에 푸시합니다.

- Bongstagram localhost 좋아요 보정: `127.0.0.1`, `::1`, IPv4-mapped loopback을 하나의 `localhost` 식별자로 통합해 로컬 브라우저가 IPv4·IPv6를 다르게 사용해도 게시물별 좋아요 IP 제한이 유지되도록 보완합니다. 변경 파일 린트·TypeScript 검사·프로덕션 빌드를 통과했으며 `feat/bonstagram`에 추가 커밋하고 `deploy/feat/bonstagram`에 푸시합니다.

- Bongstagram 스토리·프로필 UI 개선: 스토리 클릭 시 전체 화면 이미지·동영상 뷰어를 열고, 진행 바·자동 재생·좌우 버튼·스와이프·키보드 이동·닫기를 지원합니다. 프로필 상세의 빨간약 이름·프로필 이미지 전환과 피드 헤더 프로필 이미지 링크를 추가했으며, 댓글창 제목은 라이트모드 검은색·다크모드 흰색으로 표시하고 안내 문구를 제거했습니다. 스토리 뷰어도 전체 Bongstagram 음소거 상태를 공유합니다. 변경 파일 린트·TypeScript 검사·프로덕션 빌드·`git diff --check`를 통과했으며 `feat/bonstagram`에 커밋하고 `deploy/feat/bonstagram`에 푸시합니다.

- Bongstagram 댓글 관리 확장 (`feat/bonstagram`): 관리자 게시물 목록에서 댓글 수를 펼쳐 게시물별 댓글 등록·삭제가 가능하도록 하고, 댓글 관리 섹션에 작성 시간 지정·수정과 1단계 답글 등록을 추가했습니다. `024_bongstagram_comment_replies.sql`을 통해 답글 관계를 저장하며, 사용자가 migration 024 적용을 완료했습니다. 공개 댓글창은 답글을 들여쓰기하고, 작성자 프로필·스트리머 정보와 연결해 빨간약 상태에 따라 이름과 프로필 이미지를 전환합니다. 댓글 시간 입력·저장은 브라우저 시간대와 관계없이 KST(UTC+9)를 사용합니다. 관련 린트·TypeScript 검사·`git diff --check`·프로덕션 빌드를 통과했습니다. 대상 브랜치는 `feat/bonstagram`이며 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Bongstagram 댓글 관리 마무리 (`feat/bonstagram`): 등록된 게시물 목록에서 댓글 직접 수정과 작성 시간 수정, 댓글별 작성 시간순 정렬을 추가했습니다. 댓글·답글에 `author_character_id`를 저장해 프로필명 변경에도 빨간약 이름·이미지 전환이 유지되도록 했으며, 기존 댓글은 Bongstagram 프로필명 기준으로 가능한 경우 자동 연결합니다. 사용자가 `025_bongstagram_comment_author.sql`의 운영 DB 적용을 완료했습니다. 변경 파일 린트·TypeScript 검사·`git diff --check`·프로덕션 빌드를 통과했으며, 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Bongstagram 프로필·팔로우 경험 개선 (`feat/bonstagram`): 하단 네비게이션을 공통 컴포넌트로 통합하고 검색·내 프로필 라우트를 연결했으며, 만들기 버튼은 비활성화했습니다. 팔로우는 localStorage에 저장하고 현재 피드 순서는 팔로우 클릭 직후 유지한 뒤 새로고침 시 팔로우 계정 우선·비팔로우 일부 랜덤 삽입 순서로 적용합니다. 내 프로필의 팔로잉 목록은 댓글창과 같은 모달에서 검색·해제·재팔로우를 지원하며, 다른 사람 프로필과 함께 인스타그램형 프로필 화면으로 구성했습니다. 관련 린트·TypeScript 검사·`git diff --check`·프로덕션 빌드를 통과했으며, 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Bongstagram 검색 화면 개선 (`feat/bonstagram`): 검색 네비게이션 진입 시 검색창과 게시물 3열 그리드를 표시하고, 검색창 포커스 시 최근 검색 목록·개별 삭제·전체 삭제·프로필 검색 화면으로 전환하도록 구성했습니다. 최근 검색은 브라우저 localStorage에 저장하며, 빨간약 OFF에서는 프로필명·캐릭터명만 검색하고 ON에서만 스트리머명을 검색합니다. `AppImage`의 `fill`·크기 속성 충돌을 수정하고 검색창 높이를 56px로 조정했습니다. 변경 파일 ESLint·프로덕션 빌드·`git diff --check`를 통과했으며, 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Bongstagram 공개 데이터 캐시 적용 (`d5d6a72`, `feat/bonstagram`): 프로필·캐릭터·스트리머 디렉터리, 피드·프로필·게시물 상세·해시태그 게시물, 댓글 조회를 `unstable_cache` 기반 60초 캐시로 통합했습니다. 관리자 프로필·게시물·댓글 변경 시 관련 캐시 태그를 무효화하며, 방문자별 IP 좋아요 상태와 좋아요 토글은 실시간으로 유지합니다. 스토리 노출 여부는 캐시된 게시물에 대해 요청 시점 기준으로 계산합니다. 변경 파일 ESLint와 프로덕션 빌드·`git diff --check`를 통과했으며, 전체 ESLint의 기존 오류는 다른 관리자·제보 화면에 남아 있습니다. `feat/bonstagram`에 커밋하고 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Supabase·좋아요 부하 검증 (`feat/bonstagram`): k6로 운영 Supabase REST API의 공개 데이터 조회와 테스트 게시물의 좋아요 등록·동일 IP 중복 등록·취소를 측정했습니다. 10 VU·10초 테스트에서 등록 269회, 중복 등록 269회(`409` 차단), 취소 269회가 모두 기대 상태 코드로 처리됐고, 기능 검증 체크는 100%, 응답 p95는 38.26ms였습니다. 중복 등록 `409`는 정상 동작이므로 k6의 전체 HTTP 실패율에서 제외해 해석해야 합니다. 테스트 전용 좋아요 행은 종료 후 0건임을 확인했습니다. 실제 사용자 대상 Preview 부하 테스트와 Vercel·Next Server Action 경유 검증은 후속 작업으로 남겨둡니다.

- Preview 읽기 부하 검증 (`feat/bonstagram`): 로그인 없이 접근 가능한 Preview URL에서 `/`, `/bongstagram`, `/bongstagram/search`를 대상으로 k6 10 VU·30초 조회 테스트를 진행했습니다. 총 465건 요청이 모두 HTML 200으로 응답했고 실패율은 0%, 평균 325.76ms, 중앙값 345.63ms, p95 651.66ms, 최대 2.51초였습니다. 데이터 변경 요청은 포함하지 않았으므로 좋아요·댓글 Server Action과 Supabase 쓰기 부하는 별도 검증 대상입니다.

- Supabase 캐시·조회 최적화 (`feat/bonstagram`): 홈 스토리 조회를 만료 시각이 지난 행까지 읽지 않도록 `story_expires_at` 조건을 포함한 60초 캐시 함수로 분리했습니다. 댓글 조회는 댓글별로 전체 프로필·캐릭터·스트리머를 반복 조회하지 않고 캐시된 Bongstagram 디렉터리를 재사용하며, 좋아요 수 주기 갱신도 캐시된 engagement 조회를 사용합니다. 피드 커서·활성 스토리 조회 인덱스를 담은 `027_bongstagram_query_indexes.sql`을 추가했고, 사용자가 Supabase SQL Editor에서 운영 DB 적용을 완료했습니다. 변경 파일 ESLint·TypeScript·프로덕션 빌드·`git diff --check`를 통과했습니다. 대상 브랜치는 `feat/bonstagram`이며 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- 검색엔진 임시 차단 (`feat/bonstagram`): 루트 metadata에 `noindex`, `nofollow`, `noarchive`와 Googlebot 세부 지시를 추가해 전체 페이지가 검색 결과에 새로 색인되지 않도록 했습니다. robots.txt로 크롤링 자체를 차단하지 않아 이미 색인된 주소가 noindex 지시를 확인할 수 있도록 구성했습니다. 생성 HTML의 robots·googlebot 메타 태그를 확인했으며 대상 브랜치는 `feat/bonstagram`, 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- Bongstagram 좋아요 비상 전환 준비 (`feat/bonstagram`, 커밋 대기): `BONGSTAGRAM_LIKES_MODE` 환경변수로 서버 저장과 브라우저 localStorage 전용 모드를 전환할 수 있도록 게시물·스토리 좋아요 UI와 Server Action을 연결했습니다. local 모드에서는 좋아요 등록·취소 Server Action을 서버에서 거부하고, 사용자별 DB 좋아요 조회와 60초 집계 갱신도 건너뜁니다. server 모드는 기존 IP 해시 제한 동작을 유지합니다. 변경 파일 ESLint·TypeScript 검사·프로덕션 빌드·`git diff --check`를 통과했으며, 아직 커밋·푸시하지 않았습니다.

- Bongstagram 어드민 좋아요 집계 보정 (`feat/bonstagram`): 어드민 게시물 관리 페이지에 `dynamic = 'force-dynamic'`을 지정해 빌드 시 정적 HTML에 고정되던 좋아요 수를 요청 시점의 Supabase 데이터로 표시하도록 수정했습니다. 사용자가 server 모드에서 DB 좋아요 생성을 확인했고 local 모드에서는 DB 쓰기가 발생하지 않음을 확인했습니다. 변경 파일 ESLint·TypeScript 검사·프로덕션 빌드를 통과했으며 `git diff --check`도 통과했습니다. 대상 브랜치는 `feat/bonstagram`, 원격은 `deploy/feat/bonstagram`입니다.

- Bongstagram 공개 입력·요청 제한 보완 (`feat/bonstagram`): 게시물·스토리 좋아요는 IP 해시 기준 1초 간격으로 서버에서 제한하고, 공개 제보는 IP 해시 기준 30초 간격으로 제한합니다. 제보 성공 후에는 브라우저 localStorage와 카운트다운으로 제출 버튼을 비활성화하며 서버가 최종 검증합니다. 공개 제보 참고 링크는 `http`·`https` URL만 저장·관리자 화면에 표시해 안전하지 않은 스킴의 링크 실행 경로를 차단했습니다. 좋아요 제한은 `028_bongstagram_like_rate_limit.sql`, 제보 제한은 `029_report_rate_limit.sql`을 Supabase SQL Editor에서 적용합니다. 변경 파일 ESLint(기존 `react-hooks/set-state-in-effect` 규칙 위반 제외)·TypeScript·프로덕션 빌드·`git diff --check`를 통과했습니다. 대상 브랜치는 `feat/bonstagram`, 원격 대상은 `deploy/feat/bonstagram`입니다.

- Bongstagram 조회 페이지네이션·스토리 레일 개선 (`feat/bonstagram`): 메인 피드는 최초 12개, 검색·해시태그 게시물 그리드는 최초 24개를 cursor 기반으로 조회하고 하단 접근 시 다음 페이지를 무한 스크롤로 추가합니다. `posted_at`과 `id`를 함께 cursor로 사용해 정렬 경계의 중복·누락을 줄였으며, 기존 전체 게시물 일괄 그리드 컴포넌트를 제거했습니다. 홈 스토리 레일에는 모바일 스와이프와 PC 드래그를 유지하고 좌우 이동 버튼은 제거했으며 텍스트 선택도 방지했습니다. 변경 파일 ESLint·프로덕션 빌드·`git diff --check`를 통과했습니다. 대상 브랜치 `feat/bonstagram`에 커밋하고 원격 `deploy/feat/bonstagram`으로 푸시합니다.

- Bongstagram 게시물 상세·프로필 UI 개선 (`feat/bonstagram`): `/bongstagram/post/[postId]` 게시물 상세 페이지를 추가해 피드와 동일한 작성자·팔로우·미디어 캐러셀·좋아요·댓글·본문·업로드 시간 UI를 제공합니다. 검색·프로필 게시물 그리드에서 상세 페이지로 연결하고, 상세·다른 유저 프로필의 뒤로가기는 직전 페이지로 이동하도록 했습니다. 프로필 헤더 제목을 중앙 정렬하고 우측 Bongstagram 문구를 제거했으며, 다른 유저 프로필의 팔로우 버튼을 설명 아래 전체 너비로 확장했습니다. 변경 파일 ESLint·프로덕션 빌드·`git diff --check`를 통과했으며, 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- 레거시 Bonstagram 경로 폐기 (`feat/bonstagram`): 글로벌 헤더를 `/bongstagram`으로 통일하고 호환용 `/bonstagram` 라우트와 오타 테마 localStorage 키를 제거했습니다. 이미 운영 DB에 적용된 018·019 마이그레이션은 초기화 재현과 이름 변경 이력에 필요해 보존합니다. 변경 후 애플리케이션 코드의 레거시 경로 참조가 사라졌는지 확인하고, 변경 파일 ESLint·프로덕션 빌드·`git diff --check`를 통과했습니다. 대상 브랜치 `feat/bonstagram`과 원격 `deploy/feat/bonstagram` 푸시 완료를 확인했습니다.

- 사용자 전달 사항 반영: 마이그레이션 017 적용 완료 및 운영진과 논의한 ‘봉누도 따라가기’ 개발 의향을 기록했습니다. 공식 위키 준비 소식은 사용자 전달 기준이며, 새 콘텐츠 기능은 아직 기획·구현 미확정입니다.

- 3차 main 통합 완료: `8cd77e8`을 `41347a8`로 병합하고 `deploy/main`에 푸시했습니다. 마이그레이션 017은 사용자 확인으로 운영 DB 적용 완료입니다. 에이전트가 운영 DB를 재검증한 것은 아니며 Vercel 배포 완료는 별도 확인 대상입니다.

- 사용자 요청으로 3차까지 main 통합을 진행하며 **4차 이후 점검 수정은 재개 요청 전까지 중단**합니다. 3차 검증은 회귀 테스트 7개·변경 파일 린트·빌드 통과. 마이그레이션 017은 사용자 확인으로 적용 완료했습니다.

- 3차 점검 수정 (`fix/project-audit`): 캐릭터+소속 생성은 `create_character_with_membership`, 스트리머+미정 캐릭터 생성은 `create_streamer_with_character` RPC로 처리합니다. 각 함수의 두 INSERT는 단일 트랜잭션이며 오류를 삼키지 않아 후속 INSERT 실패 시 전체 롤백됩니다. `017_atomic_creation.sql`은 함수 추가·실행 권한 제한만 수행하고 기존 행을 변경하지 않습니다. 운영 DB 적용은 사용자가 완료했다고 확인했습니다.
- **3차 배포 순서**: Supabase SQL Editor에서 `supabase/migrations/017_atomic_creation.sql` 적용 → 코드 배포. 기존 생성 코드는 새 함수 추가 후에도 동작합니다. 새 코드에서 함수가 없으면 DB 업데이트(017) 안내를 표시하며 이전 다단계 INSERT로 되돌아가지 않습니다. 실행 권한은 `service_role`만 허용합니다.
- 3차 검증: 테스트용 개발 의존성 `@electric-sql/pglite`로 격리된 PostgreSQL에서 정상 생성, 없는 조직·스트리머 참조, 중복 채널, 두 번째 INSERT 강제 실패 시 롤백, 함수 실행 권한을 검증합니다. `node --experimental-strip-types --test tests/*.test.mjs`로 재현 가능. 운영 DB 쓰기 없음. 이전에 생긴 불완전한 데이터의 자동 정리는 포함하지 않습니다.

- 2차 수정 main 통합: `fix/project-audit`의 `e956dff`를 병합 대상으로 반영했습니다. 지도·스트리머 저장 실패 처리, 입력 유지·로딩 해제, 제보 좌표 추가 오류 처리 포함. 회귀 테스트 5개와 변경 파일 린트·프로덕션 빌드 통과. 생성 트랜잭션은 3차에서 진행합니다. 원격 푸시·배포 결과는 각각 확인하며, 이 기록은 병합 커밋에 포함합니다.

- 2차 점검 수정 (`fix/project-audit`): 지도·스트리머 DB 저장 실패와 대상 없음 오류를 화면에 표시하고 입력·선택을 유지합니다. 공통 `useAdminMutation` 훅으로 비동기 예외와 중복 실행을 처리하며 로딩을 해제합니다. 스트리머 추가 폼을 클라이언트 컴포넌트로 분리하고 제보 좌표의 장소 추가에도 동일한 오류 처리를 적용했습니다. 생성 부분 성공은 명시적으로 안내하며 원자성 보장은 3차 대상입니다. `node --experimental-strip-types --test tests/*.test.mjs` 5개 통과, 변경 파일 린트·프로덕션 빌드 통과. 실제 DB 변경 없음.

- 조직 관리 삭제 버튼 표시 개선: 일반 목록·편집 모드 모두 텍스트 삭제 버튼 표시, 삭제 확인/취소 유지, 관리 열 확장 및 좁은 화면 가로 스크롤 지원. 삭제 실패 메시지와 로딩 해제 처리 추가. 변경 파일 린트·TypeScript 검사 통과; 실제 조직 삭제는 수행하지 않았습니다. `20986da`를 `ad2bc89`로 main에 병합하고 `deploy/main` 푸시 완료.

### 커밋·브랜치 규칙

- 커밋 제목은 `type: 변경 내용` 형식을 사용합니다. 타입은 `feat`, `fix`, `style`, `refactor`, `docs`, `test`, `chore` 중 작업 성격에 맞게 선택합니다.
- 점검 수정은 `fix/project-audit`에서 단계별로 커밋하고, 관련 검사 결과와 작업 내용을 문서에 기록합니다.
- 커밋·푸시와 `main` 병합은 사용자 요청에 따라 진행합니다. 병합 전 원격 변경을 확인하고 강제 푸시는 사용하지 않습니다.
- 커밋·푸시 또는 main 병합 시 이 문서에 변경 내용·검증 결과·대상 브랜치·확인된 반영 상태를 함께 갱신합니다. 기록은 해당 작업 커밋 또는 병합에 포함하며, 문서 자체의 커밋 해시를 기록하려고 반복 커밋하지 않습니다.
- 푸시와 Vercel 배포 완료는 구분합니다. 확인하지 않은 푸시·배포 결과는 완료로 기록하지 않습니다.
- 1차 멤버 분리 기능은 사용자 동작 확인을 완료했으며, 공개·관리자 화면의 용어를 ‘탈퇴’로 통일했습니다.

- 전체 점검 후 1차 수정: 조직 상세는 `left_at` 기준으로 현재/이전 멤버를 구분합니다. 현재 소속 중 활동·비활동 멤버를 합산하고, 이전 멤버는 별도 섹션과 탈퇴 배지를 표시합니다. 분류 함수: `src/lib/data/organization-members.ts`. 회귀 테스트: `node --experimental-strip-types --test tests/organization-members.test.mjs` (2개 통과), 변경 파일 린트·빌드 통과. `fix/project-audit` 브랜치의 1차 수정입니다.

- 2026-09-12 전체 점검: [PROJECT_AUDIT.md](./PROJECT_AUDIT.md). 빌드 성공, 린트 오류 6개·경고 8개, 기존 테스트 8/10 성공. 발견한 기능 문제·검증 한계·수정 우선순위는 점검 문서 참조. 이번 점검에서는 애플리케이션 코드나 DB를 수정하지 않았습니다.

아래 표의 커밋은 `deploy/main`에 반영·푸시 완료했습니다. 1차 멤버 수정은 사용자 동작 확인 후 `d47ade2`로 병합했습니다. 나머지 점검 항목은 [PROJECT_AUDIT.md](./PROJECT_AUDIT.md)를 기준으로 순차 진행합니다. 배포 완료 여부는 Vercel에서 별도로 확인합니다.

| 커밋 | 작업 내용 |
|---|---|
| `ad2bc89` | 조직 삭제 버튼 표시·오류 처리 개선 main 병합 |
| `20986da` | 조직 관리 삭제 버튼 상시 표시, 관리 열 확장, 삭제 실패 처리 |
| `d47ade2` | 1차 점검 수정 main 병합 (현재/이전 멤버 분리 및 탈퇴 표기) |
| `33c6d13` | 공개·관리자 화면 용어를 탈퇴로 통일, 커밋 규칙 문서화 |
| `82c0a1b` | 탈퇴 멤버 분리·현재 인원 집계 수정, 회귀 테스트 및 전체 점검 문서 |
| `22bc774` | 스트리머 카드 우상단 조직 뱃지 제거 |
| `11df7c9` | 스트리머 목록: 캐릭터 소속 조직 쿼리 분리 (4단계 중첩 버그 수정) |
| `f4bf847` | 스트리머 목록: 빨간약 ON 시 제목 스트리머명 유지 |
| `8ffe00b` | 스트리머 상세: 캐릭터 소속 조직 쿼리 분리 (4단계 중첩 버그 수정) |
| `ed581bc` | 캐릭터 목록: 조직 뱃지 옆에 직책 인라인 표시 |
| `70b8fa5` | 캐릭터 목록/상세/조직 멤버카드: 직업이 '가이드'인 캐릭터에 teal 뱃지 표시 |
| `a218279` | 어드민: 캐릭터 추가 기능 + 스트리머 추가 시 '미정' 캐릭터 자동 생성 |
| `423454e` | 어드민 멤버 관리: 정렬 상태에서 드래그 순서 변경 가능 |
| `8e6385f` | 어드민 멤버 관리: 칼럼 헤더 정렬 기능 추가 |
| `31ac7d0` | 조직 상세 멤버카드: 직업 대신 소속 조직명 표시 |
| `0f89db4` | 전체 상세 페이지 뒤로가기 버튼 → router.back() 통일 (BackButton 컴포넌트) |
| `69fb30c` | 캐릭터 카드: 빨간약 ON 시 스트리머 프로필·치지직 바로가기 (우상단 absolute 배치) |
| `dfee92a` | 인물 관계 타입 '동료(colleague)' 추가 + 마이그레이션 016 |
| `aa35cf6` | feat/clip-embed 머지: 클립 임베드 플레이어 + 사건 편집 순서 조정 |
| `ec4eefa` | 조직 멤버 순서 직접 설정 (sort_order 컬럼, 어드민 드래그 앤 드롭 UI) |
| `0221fd9` | Vercel Analytics + Speed Insights 연동 |
| `afdec1b` | 캐릭터 상세 페이지: 소속 조직 거점 미니맵 추가 |
| `1ac8b6b` | 어드민 조직 멤버 일괄 편집 — 다중 추가·인라인 편집·일괄 탈퇴·복귀 |
| `3f4ec2d` | 지도: gang_id 연결된 불법 사업체 org 좌표를 갱단 biz 마커로 자동 표시 |
| `5172f30` | 조직 불법 사업체 위치 기능 추가 (biz_x/biz_y/biz_label 컬럼, 어드민 편집) |
