# 봉누도 따라가기 — 프로젝트 가이드

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


| 항목        | 선택                                          |
| --------- | ------------------------------------------- |
| 프레임워크     | Next.js 15+ (App Router)                    |
| 언어        | TypeScript                                  |
| 스타일       | Tailwind CSS v4                             |
| DB / Auth | Supabase (PostgreSQL)                       |
| 지도        | react-leaflet (GTA V 커스텀 CRS)               |
| 아이콘       | lucide-react                                |
| 배포        | Vercel — `https://bnd2-fanwiki.vercel.app/` |


---

## 디렉토리 구조

```
src/
├── app/                        # Next.js App Router 페이지
│   ├── page.tsx                # 홈 (통계, 최근 사건, 빠른 링크) [ISR 60s]
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
│   │   ├── LeafletMap.tsx      # Leaflet 지도 본체 (SSR 제외, dynamic import, 타일 bounds·줌 제한)
│   │   └── MapPinPopup.css     # 팝업 opacity 전환 제거 (꼬리표 지연 없는 닫기)
│   ├── search/page.tsx         # 통합 검색
│   ├── schedule/               # 방송 일정
│   ├── guide/                  # 입문 가이드
│   ├── report/                 # 제보 폼
│   ├── api/
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
│       ├── reports/            # 제보 관리 (상태 필터, 상태 변경, IP 해시 차단, 좌표 → 주요 장소 추가)
│       │   └── ReportCoordAction.tsx  # 좌표 제보 파싱 → 주요 장소 직접 추가 클라이언트 컴포넌트
│       └── blocked-ips/        # 차단 IP 해시 목록 + 해제
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
│   ├── data/
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
- 빨간약 OFF로 진입하면 iframe 위에 불투명한 주의 오버레이와 `클립 보기` 버튼을 표시하고, 빨간약 ON이면 즉시 공개
- YouTube 백그라운드 iframe은 `autoplay` 없이 프리로드 (동시 재생 방지)
- 플레이리스트: 좌우 버튼 내비게이션 (끝 도달 시 버튼 `opacity-0`), `scrollBy(clientWidth)` 단위 이동
- 툴팁: `overflow-x: scroll` 클리핑 우회를 위해 `getBoundingClientRect` + `fixed` 포지션으로 렌더링

### 스트리머 목록

- 빨간약 ON에서도 카드 헤더에는 스트리머명만 표시하고, 캐릭터·소속 정보는 카드 본문에서만 표시해 중복 노출을 방지

### BBS 관리자

- 기사 목록에서 공개·비공개 상태를 직접 전환할 수 있으며, 공개 상태 변경 시 BBS 관련 캐시를 갱신
- 공개 기사 수정 시 목록·이웃 기사 캐시도 갱신하며, 목록 데이터·최신 기사·일차·기자 필터 캐시는 1년, 상세·이웃 캐시는 30일 유지
- `public/bbs-json-to-markdown.html`에서 기사 JSON의 본문 HTML을 BBS 입력용 Markdown으로 변환하고 첫 본문 이미지 URL을 대표 이미지로 복사 가능
- 대표 이미지가 비어 있으면 본문 첫 이미지, 첨부 이미지 첫 장 순서로 자동 지정하며 기사 상세에서는 대표 이미지와 중복되는 본문 이미지가 다시 표시되지 않음
- BBS 공개 화면은 `bbs-media` Supabase Storage 공개 URL을 `unoptimized`로 직접 사용하고, JSON 가져오기는 Fivemanage 원본 이미지를 Storage로 이전한 뒤 비공개 기사로 저장 (`b5f9006`, `deploy/main` 푸시 완료)
- 이미지 원본 URL fallback 매핑과 `BBS_MEDIA_MODE` 전환 기능을 추가했습니다 (`a8d51a2`, migration 049 필요, `deploy/main` 푸시 완료)
- JSON 이미지 이전 실패 시 기사별 Markdown 다운로드와 원본 URL 유지 비공개 등록을 선택할 수 있으며, `scripts/migrate-bbs-external-images.mjs`의 백업 manifest·`scripts/rollback-bbs-external-images.mjs`로 일괄 이전을 확인·롤백
- `BBS_MEDIA_MODE`가 `storage`이면 Storage URL을 사용하고 `external`이면 `bbs_article_media_sources` 매핑을 통해 원본 URL을 사용합니다. 매핑이 없는 이미지는 Storage URL로 fallback합니다.

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


| 페이지                                           | revalidate |
| --------------------------------------------- | ---------- |
| `/`                                           | 60s        |
| `/streamers`, `/streamers/[id]`              | 60s        |
| `/characters`, `/characters/[id]`             | 300s       |
| `/organizations`, `/organizations/[id]`       | 300s       |
| `/events`, `/events/[id]`, `/events/timeline` | 300s       |
| `/map`                                        | 300s       |


---

## DB 주요 테이블


| 테이블                       | 설명                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `streamers`               | 스트리머 (chzzk_channel_id, display_name, profile_image_url, is_active)                                   |
| `characters`              | RP 캐릭터 (name, alias[], job, status, avatar_url)                                                       |
| `organization_members`    | 캐릭터↔조직 N:M (role, is_primary, joined_at, left_at, sort_order)                                         |
| `organizations`           | 조직 (category, color, hq_x, hq_y, hq_label, biz_x, biz_y, biz_label, gang_id, is_active, is_disbanded) |
| `map_locations`           | 주요 장소 핀 (name, label, description, color, x, y)                                                       |
| `events`                  | 사건 아카이브 (type, occurred_at, is_published)                                                             |
| `event_participants`      | 사건↔캐릭터 N:M (role, sort_order)                                                                         |
| `event_clips`             | 사건 클립 (clip_url, label, streamer_id, sort_order)                                                      |
| `character_relationships` | 캐릭터 관계 (type: friend/enemy/rival/family/romantic/ally/mentor/colleague/neutral)                       |
| `reports`                 | 제보 (type, status: pending/reviewing/applied/rejected, ip_hash)                                        |
| `bongstagram_profiles`    | 기존 `characters`와 1:1로 연결되는 Bongstagram 표시 닉네임                                                         |
| `bongstagram_posts`       | Bongstagram 게시물·스토리 본체 (character_id, post_type, content, posted_at, story_expires_at)                |
| `bongstagram_post_media`  | 게시물 미디어 (image/video URL, Storage 경로, sort_order)                                                     |
| `blocked_ips`             | 차단 IP 해시 목록 (ip_hash, reason)                                                                         |


### 마이그레이션 파일 (supabase/migrations/)


| 파일                                         | 내용                                                  |
| ------------------------------------------ | --------------------------------------------------- |
| 001~009                                    | 초기 스키마, 조직 카테고리, 연락처, 해산, 원자적 저장, IP 신고·차단          |
| `010_org_hq.sql`                           | organizations 테이블에 hq_x, hq_y, hq_label 컬럼 추가       |
| `011_map_locations.sql`                    | map_locations 테이블 생성 (RLS 포함)                       |
| `013_org_business_location.sql`            | organizations 테이블에 biz_x, biz_y, biz_label 컬럼 추가    |
| `014_member_sort_order.sql`                | organization_members 테이블에 sort_order 컬럼 추가          |
| `015_event_sort_orders.sql`                | event_participants 테이블에 sort_order 컬럼 추가            |
| `016_relationship_add_colleague.sql`       | character_relationships CHECK 제약에 'colleague' 추가    |
| `017_atomic_creation.sql`                  | 캐릭터·스트리머와 연결 데이터 원자적 생성 RPC 추가                      |
| `018_bonstagram_profiles.sql`              | 기존 캐릭터와 1:1 연결되는 Bongstagram 프로필 테이블 생성             |
| `019_rename_bongstagram.sql`               | 적용된 018의 테이블·제약조건·트리거·RLS 정책명을 Bongstagram으로 변경     |
| `020_bongstagram_posts.sql`                | Bongstagram 기본 게시물 테이블 생성 (RLS 포함)                  |
| `021_bongstagram_media.sql`                | 게시물·스토리 타입과 이미지·동영상 다중 미디어 테이블 추가, 기존 image_url 이관  |
| `022_bongstagram_storage.sql`              | Bongstagram 직접 업로드용 Storage 버킷과 미디어 storage_path 추가 |
| `023_bongstagram_interactions.sql`         | 게시물별 IP 제한 좋아요와 관리자 전용 댓글 테이블 추가                    |
| `024_bongstagram_comment_replies.sql`      | 댓글 작성 시간 관리와 1단계 답글용 parent_comment_id 추가           |
| `025_bongstagram_comment_author.sql`       | 댓글 작성자 캐릭터 연결과 기존 프로필명 기반 데이터 보정                    |
| `036_hash_report_ips.sql`                  | 제보·차단 목록에 서버 비밀키 기반 IP 해시 컬럼 추가                     |
| `037_drop_legacy_blocked_ip.sql`           | 기존 차단 데이터 확인 후 blocked_ips의 원본 ip 컬럼 제거             |
| `038_map_location_wiki_path.sql`           | 주요 장소 핀에 선택형 위키 링크 컬럼 추가                            |
| `039_map_location_external_wiki_links.sql` | 주요 장소 위키 링크를 외부 URL로 전환하고 조직 거점 위키 링크 컬럼 추가         |
| `040_ingame_ingest_source.sql` | Bongstagram·BBS 인게임 수집 대비 source·external_id 컬럼과 중복 방지 제약 추가 |
| `041_bbs_article_reaction_rate_limit.sql` | 기사별 IP 해시 기준 좋아요·싫어요 30초 요청 제한 |
| `042_event_highlight_type.sql` | 사건 아카이브에 하이라이트 유형 추가 (운영 DB 미적용) |


---

## 구현 완료 기능

### 공개 페이지

- [x] 홈 — 통계, 최근 사건, BBS 최신 기사, 빠른 탐색 카드 (라이브 섹션은 LIVE_ENABLED 조건부)
- [x] `/live` — 온라인/오프라인 실시간 분류, 조직 필터 (현재 임시 중단 안내)
- [x] `/streamers` — 목록 (라이브 확인 없이 디렉토리 형태)
- [x] `/streamers/[id]` — 스트리머 상세
- [x] `/characters` — 목록 + 필터 (빨간약 ON 시 카드 우상단에 스트리머 프로필·치지직 바로가기, 조직 뱃지 우측에 직책 인라인 표시, 가이드 뱃지)
- [x] `/characters/[id]` — 상세 (소속 조직, 인물 관계, 참여 사건, 소속 조직 거점 인라인 미니맵, 가이드 뱃지)
- [x] `/organizations` — 목록 (갱단/공무직/사업체 등, 갱단 카드에 연결된 불법 사업체 표시)
- [x] `/organizations/[id]` — 상세 (멤버카드에 소속 조직명·직책·가이드 뱃지, 운영 사업체, 관련 사건, 인라인 미니맵)
- [x] `/map` — GTA V 거점 지도 (조직 드롭핀·사업체 다이아몬드·주요 장소 원형 마커, Atlas/위성 전환, 그룹 필터 UI)
- [x] `/events` — 목록 + 타입 필터
- [x] `/events` — 초기 12건 조회 후 하단 도달 시 다음 사건을 추가하는 무한 스크롤
- [x] `/events/[id]` — 상세 (참여자 sort_order 정렬, 클립 인라인 임베드 플레이어)
- [x] `/events/timeline` — 연대표 (가로/세로, 캐릭터/조직/전체 필터)
- [x] `/search` — 통합 검색 (캐릭터/스트리머/사건/조직, 조직·사건 확장 카드)
- [x] `/schedule`, `/guide`, `/report` — 일정, 가이드, 제보 폼 (일정 KST 상태·운영 시간·종료 시각, 지난 일정 접기/펼치기, 지도 핀 위치 첨부 기능 포함)

### 어드민 (`/admin/*`)

- [x] 대시보드 — 통계, 미정 캐릭터·미처리 제보 바로가기
- [x] 캐릭터/조직/사건/관계 CRUD (캐릭터 RP명 인라인 수정, 조직 불법 사업체 gang_id 연결)
- [x] 사건 인라인 삭제 (2단계 확인)
- [x] 스트리머 관리 — 추가/수정/삭제, 치지직 채널 ID·프로필 이미지 관리
- [x] 거점 지도 관리 — 조직 거점/사업체 모드 탭, 클릭 배치, 주요 장소 추가/수정/이동/삭제
- [x] 제보 관리 — 대기중 기본 필터, 상태·유형 필터(동시 적용 가능), 상태 변경, IP 차단 버튼, 좌표 제보 시 주요 장소 직접 추가, 제보 템플릿 복사
- [x] IP 차단 관리 — 차단 목록 확인, 차단 해제
- [x] 조직 멤버 일괄 편집 (`/admin/organizations/[id]`) — 멤버 다중 추가(검색→대기열→일괄 추가), 역할·주소속 인라인 편집, 체크박스 일괄 탈퇴, 이전 멤버 복귀, 드래그 앤 드롭 순서 조정, 칼럼 헤더 정렬(정렬 상태에서 드래그 가능)
- [x] Vercel Analytics + Speed Insights 연동 (`@vercel/analytics/next`, `@vercel/speed-insights/next`)
- [x] 사건 편집 — 참여 캐릭터·클립 드래그 앤 드롭 순서 조정 + 순서 저장
- [x] 캐릭터 추가 — 어드민 캐릭터 관리 페이지에서 스트리머 연결 없이 직접 추가 가능
- [x] 스트리머 추가 시 '미정' 캐릭터 자동 생성·연결

### Bongstagram (공개 경로 임시 비활성, 관리자 관리 유지)

- [x] 홈·전역 헤더에서 공개 Bongstagram 노출 제거 및 `/bongstagram`·하위 공개 경로 404 차단
- [x] `/bongstagram` Instagram 스타일 모바일 피드 레이아웃과 Bongstagram 프로필 안내 UI
- [x] 글로벌 네비게이션의 다크/라이트 테마 토글과 브라우저 저장
- [x] `bongstagram_profiles` 1:1 계정 테이블·프로필 이름 제약 마이그레이션 작성 (`018_bonstagram_profiles.sql`, `019_rename_bongstagram.sql`)
- [x] 기존 캐릭터 선택 기반의 Bongstagram 프로필 등록/수정/삭제 화면 (`/admin/bongstagram`)
- [x] 관리자 캐릭터 선택 드롭다운 텍스트 검색, 조직 필터, Bongstagram 연결 상태 3단계 필터와 미연결 캐릭터 행의 프로필 수정
- [x] Bongstagram 게시물·스토리 등록·수정·삭제 관리자 화면과 공개 피드 연결 (이미지·동영상 여러 개, `/admin/bongstagram/posts`)
- [x] 관리자 게시물 작성 시 Supabase Storage 직접 업로드 (이미지 10MB·동영상 100MB, 일회성 업로드 URL, 파일 삭제 시 Storage 정리)
- [x] 게시물 상세 페이지
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
- [x] BBS 공개 기사 카드 카테고리 표시 및 사용자 싫어요 비활성화 — 기사 목록에서 말머리를 표시하고 공개 화면은 좋아요만 제공하며 서버에서도 싫어요 요청을 거부
- [x] BBS 기사 상세 반응 분리 — 기사 본문은 반응 상태 조회 없이 캐시 응답으로 제공하고, 좋아요·싫어요 집계와 IP별 반응 상태는 클라이언트에서 별도 조회
- [x] BBS 기사 상세 필터·이웃 이동 분리 — 서버 상세 페이지에서 `searchParams`와 이전·다음 기사 조회를 제거하고, 클라이언트가 현재 필터 조건을 유지한 채 목록 복귀·이웃 기사를 조회
- [x] 사건 상세 대표 이미지 비율 보정 — 세로 이미지를 화면 높이 안에서 원본 비율로 전체 표시하고, 가로 이미지와 함께 `object-contain`으로 잘림을 방지
- [x] 사건 목록 API 응답 축소 및 오류 진단 — 목록에 사용하지 않는 `content`를 제외하고, Supabase 조회 실패 시 오류 정보와 요청 조건을 서버 로그에 기록
- [x] BBS 기사 이미지 Storage migration 운영 DB 적용 (`034_bss_storage.sql`, 사용자 확인)
- [x] BBS 기사 DB 식별자 rename migration 운영 DB 적용 (`035_rename_bss_tables_to_bbs.sql`, 사용자 확인)
- [x] 인게임 수집 대비 source·external_id migration 운영 DB 적용 (`040_ingame_ingest_source.sql`, 사용자 확인)
- [x] BBS 기사 리액션 rate limit migration 운영 DB 적용 (`041_bbs_article_reaction_rate_limit.sql`, 사용자 확인)
- [x] 이미지 전송 최적화 기반 — 일반 목록·상세 이미지는 원본 표시를 유지하면서 Vercel `next/image` 최적화·캐시를 사용하고, BBS 공개 화면은 `bbs-media` Storage URL을 직접 사용하며 새 Storage 파일에는 1년 캐시를 적용
- [x] 이미지 캐시 기간 확대 — Supabase Storage 이미지의 Next Image 최적화 결과를 30일 캐시
- [x] 이미지 변형 수 제한 — Next Image의 디바이스·소형 사이즈 후보를 제한하고 WebP로 고정
- [x] BBS 본문 이미지 삽입 — 첨부 이미지 버튼으로 커서 위치에 마크다운 이미지를 삽입하고 본문에서도 Next Image로 표시
- [x] BBS 공개 목록 일차 필터 — 승인일시 기준 일차 범위와 앞뒤 2시간 여유 범위로 필터링하고, 5개 열 그리드·외부 클릭 닫기·반응형 위치 조정을 지원
- [x] 사건 아카이브 일차 필터 — 발생일시 기준으로 사건이 있는 일차만 BBS와 같은 원형 버튼·5열 메뉴로 표시하고 유형 필터와 함께 적용
- [x] 사건·BBS 일차 판정 보완 — UTC로 반환되는 DB 시간을 KST 범위의 timestamp로 비교해 일차 존재 여부를 정확히 계산
- [x] BBS 공개 목록 정렬·무한 스크롤 — 최신순·오래된순을 승인일시 기준으로 선택하고, 12건씩 하단 도달 시 추가 로드
- [x] BBS 기사 입력 폼 상단 작업 버튼 — 기사 등록·수정·취소 버튼을 상단에도 배치
- [x] BBS JSON 기사 가져오기 — 어드민에서 `rows` JSON을 일괄 가져와 비공개 기사로 저장하고 원본 ID 중복을 건너뛰며, 본문 최상단 이미지를 대표 이미지로 지정하고 HTML 태그·특수문자를 Markdown으로 안전하게 변환
- [x] BBS 이미지 이전·복구 도구 — 기존 외부 이미지 일괄 이전 전 원본 URL과 작업 상태를 manifest에 저장하고, 생성 파일만 추적해 롤백하며, 어드민 이미지 이전 실패 시 기사별 Markdown 다운로드·원본 URL 비공개 등록을 지원
- [x] BBS 목록 캐시 장기화 — 목록·최신 기사·일차·기자 필터 데이터는 1년 캐시하고, 공개 기사 수정·등록·공개 전환·삭제 시 목록 캐시를 무효화
- [x] BBS 필터 복귀 상태 유지 — 기사 상세 이동·뒤로가기 때 카테고리·기자·일차·정렬 조건을 목록 URL로 유지
- [x] BBS 기사 상세 연속 이동 — 현재 목록 필터를 유지한 채 이전 기사·다음 기사로 이동하고, 상세 대표 이미지는 우선 로드
- [x] BBS 목록 캐시·스크롤 복귀 — BBS 전용 TanStack Query 캐시와 12건 단위 무한 스크롤을 적용하고, 기사 진입 전 내부 스크롤 위치를 저장해 목록 복귀 시 복원
- [x] Vercel 전송·이벤트 비용 절감 — Web Analytics·Speed Insights 수집을 제거하고, 공개 BBS 페이지에 브라우저·Vercel CDN 캐시 헤더를 적용
- [x] BBS 어드민 기사 페이지네이션 — 서버에서 현재 페이지 기사와 관련 데이터만 조회하고 10·20·30·40·50개 단위 선택 및 필터·정렬·페이지 URL 유지를 지원
- [x] 어드민 목록 페이지네이션 — 사건·스트리머·관계·IP 차단·캐릭터 관리에서 현재 페이지 데이터를 조회하고 10·20·30·40·50개 단위 선택을 지원
- [x] 어드민 사건 필터 — 사건 관리 목록에서 유형·공개 여부·발생일자 범위·발생일 정렬을 전체 결과 기준으로 필터링하고 페이지네이션
- [x] 어드민 BBS 반응 정렬 — 좋아요·싫어요 정렬 시 전체 필터 결과의 반응 수를 기준으로 먼저 정렬한 뒤 페이지네이션
- [x] 캐릭터 추가 스트리머 검색 — 캐릭터 추가 폼의 스트리머 선택 메뉴에서 이름 검색 지원
- [x] 캐릭터 미정 상태 구분 — 캐릭터명 공백 입력만 미정 상태로 저장하고, 실제 이름 `미정`은 일반 캐릭터명으로 검색 가능하게 구분
- [x] 스트리머 검색 미정 처리 — 빨간약 ON 상태에서도 검색어가 있을 때 미정 상태 캐릭터를 제외하고 실제 스트리머명·캐릭터명은 구분해 검색
- [x] 스트리머 목록 미정 처리 — 스트리머 페이지의 빨간약 캐릭터 표시·검색에서도 미정 상태 캐릭터를 제외
- [x] BBS·사건 상세 캐시 보완 — BBS 기사 상세 페이지·데이터·상세 CDN 재검증을 30일로 확대하고 사건 목록 API 응답 필드를 필요한 범위로 축소
- [x] Vercel 빌드 호환 보완 — BBS 기사 상세의 30일 재검증 값을 정적 숫자 리터럴로 지정해 세그먼트 설정 검증을 통과
- [x] BBS 이미지 확대·비율 보완 — 본문 이미지 클릭 확대를 추가하고, 상세 대표 이미지를 본문과 같은 `1200×900` 기준으로 표시
- [x] BBS 운영 일차 자동 계산 — 9/14~10/4 운영일을 금요일 휴일 제외로 생성하고, 마지막 일차 필터 범위를 10/5 05:00까지 확장
- [x] BBS 일차 기사 존재 필터 — 공개 기사가 있는 일차만 일차 선택 메뉴에 표시
- [x] BBS 홈 진입 스크롤 초기화 — 기사 상세 뒤로가기 복원은 유지하고 홈의 BBS 전체보기 진입 시 저장된 목록 위치를 초기화
- [x] 어드민 제보 관리 페이지네이션 — 검색·상태·유형 필터를 서버에서 처리하고 10·20·30·40·50개 단위 페이지네이션을 지원
- [x] BBS 캐시 태그 세분화 — 기사 목록·최신 기사·일차 목록, 이전·다음 기사 연결, 개별 기사 상세·댓글 수 캐시를 분리하고 액션별 필요한 범위만 무효화
- [x] 어드민 모바일 대시보드 — 모바일 상단 가로 스크롤 관리 메뉴와 로그아웃을 제공하고, 통계·주요 작업 카드를 작은 화면에 맞게 배치
- [x] 사건 클립 빨간약 주의 대비 개선 — 라이트 모드에서도 주의 오버레이·안내 문구·클립 보기 버튼이 선명하게 보이도록 전용 대비 스타일 적용
- [x] 사건 클립 시점 빨간약 처리 — 빨간약 OFF에서 캐릭터 매핑이 없는 스트리머명이 노출되지 않도록 시점명을 숨김
- [x] 사건 클립별 이름 매핑 보완 — 클립의 스트리머 ID를 기준으로 라벨·시점의 캐릭터명 치환을 우선 적용
- [x] 사건 클립 누락 매핑 보완 — 참여 인물에 없는 클립 스트리머도 연결된 캐릭터를 조회해 빨간약 OFF 이름 치환에 포함
- [x] 사건 아카이브 스크롤 복귀 — 사건 상세 진입 전 목록 위치를 저장하고 뒤로가기 시 필요한 무한 스크롤 데이터를 복원한 뒤 위치를 되돌림
- [x] 사건 아카이브 TanStack Query 캐시 — 사건 필터별 `useInfiniteQuery` 캐시와 10페이지 제한을 적용하고 목록 복귀 시 캐시를 재사용
- [x] BBS 기사 상세 이동·이미지 스타일 보완 — 이전·다음 기사 카드를 필터 정렬 순서에 맞춰 이동하고, 방향 꺾쇠 아이콘과 본문 이미지 라운드를 적용
- [x] 관리자 BBS JSON 본문 블록 변환 보완 — 문단과 인라인 HTML 태그를 Markdown 변환 과정에서 유지
- [x] 사건 상세 이전·다음 이동 — 사건 유형 필터를 유지하고 발생일 기준 시간순으로 인접 사건을 연결
- [x] 사건 상세 목록 이동 — 뒤로가기 대신 유형·일차 필터를 유지하는 `목록으로` 링크 제공
- [x] BBS 이동 카드 툴팁 — 이전·다음 기사 라벨을 제거하고 호버·키보드 포커스 시 전체 제목을 표시
- [x] BBS 다크모드 강조색 — 주황색 텍스트를 공통 변수로 분리하고 다크모드 색감을 완화

---

## 환경변수


| 변수                              | 용도                                                                |
| ------------------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase 프로젝트 URL                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                                                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | 서버 전용 서비스 롤 key (어드민, 업로드 스크립트)                                   |
| `BBS_MEDIA_MODE`                | BBS 이미지 서빙 경로 (`storage` 기본값, `external`은 저장된 원본 URL 사용)             |
| `BONGSTAGRAM_SERVER_FINAL_DATE` | 서버 마지막 종료일 (`YYYY-MM-DD`, 해당일 오전 3시에 스토리 전체 종료)                   |
| `BONGSTAGRAM_LIKES_MODE`        | 좋아요 저장 모드 (`server` 기본값, `local`은 브라우저 localStorage만 사용)          |
| `BBS_REACTIONS_MODE`            | BBS 좋아요·싫어요 저장 모드 (`local` 기본값, `server` 설정 시 IP 해시 DB 저장)        |
| `IP_HASH_SECRET`                | 제보·좋아요·차단에 공통 사용할 서버 전용 IP 해시 비밀키 (미설정 시 기존 해시 비밀키 또는 서비스 롤 키 사용) |
| `ADMIN_PASSWORD`                | 어드민 로그인 비밀번호                                                      |
| `ADMIN_TOKEN`                   | 어드민 쿠키 검증 토큰                                                      |
| `NEXT_PUBLIC_MAP_TILE_BASE`     | 지도 타일 CDN 베이스 URL (Supabase Storage, 미설정 시 public/ 직접 서빙)         |
| `DISCORD_REPORT_WEBHOOK_URL`    | 모든 새 제보를 관리자 Discord 채널로 템플릿 전송하는 서버 전용 Webhook URL |
| `DISCORD_REPORT_WEBHOOK_NEW_CHARACTER` / `NEW_EVENT` / `CORRECTION` / `OTHER` | 해당 제보 유형을 추가 전송하는 카테고리별 Discord Webhook URL |


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

## 작업 기록 확인 가이드

- 현재 프로젝트 구조·기능·스키마·환경변수·주의사항은 이 문서에서 확인합니다.
- 과거 작업의 상세 변경 내용, 검증 결과, migration 상태, 커밋·브랜치·푸시 기록은 [CHANGELOG.md](./CHANGELOG.md)에서 확인합니다.
- 작업을 시작할 때는 이 문서의 관련 기능 설명을 먼저 확인하고, 기존 변경의 배경이나 반영 상태가 필요하면 `CHANGELOG.md`의 최신 관련 기록을 확인합니다.
- 커밋·푸시 또는 `main` 병합 시에는 이 문서에 현재 상태를 간결하게 갱신하고, 상세 작업 기록은 `CHANGELOG.md`에 남깁니다.

### 커밋·브랜치 규칙

- 커밋 제목은 `type: 변경 내용` 형식을 사용합니다. 타입은 `feat`, `fix`, `style`, `refactor`, `docs`, `test`, `chore` 중 작업 성격에 맞게 선택합니다.
- 점검 수정은 `fix/project-audit`에서 단계별로 커밋하고, 관련 검사 결과와 작업 내용을 문서에 기록합니다.
- 커밋·푸시와 `main` 병합은 사용자 요청에 따라 진행합니다. 병합 전 원격 변경을 확인하고 강제 푸시는 사용하지 않습니다.
- 커밋·푸시 또는 main 병합 시 이 문서에 변경 내용·검증 결과·대상 브랜치·확인된 반영 상태를 함께 갱신합니다. 기록은 해당 작업 커밋 또는 병합에 포함하며, 문서 자체의 커밋 해시를 기록하려고 반복 커밋하지 않습니다.
- 푸시와 Vercel 배포 완료는 구분합니다. 확인하지 않은 푸시·배포 결과는 완료로 기록하지 않습니다.

## 2026-09-16 작업 기록

- `/api/events`에서 필터 결과보다 큰 offset 요청으로 발생하던 Supabase `PGRST103` 오류를 정상적인 빈 페이지 응답으로 처리했습니다. 실제 데이터베이스 오류는 기존처럼 500으로 반환합니다.
- 검증: `npx tsc --noEmit` 통과. `npm run build`는 코드 오류 없이 Google Fonts 네트워크 접근 실패로 중단되었습니다.
- 대상 브랜치: `main` (`deploy` 원격으로 푸시)

## 2026-09-16 작업 기록 추가

- 캐릭터·스트리머 상세 페이지의 ISR 및 상세 데이터 캐시 수명을 24시간에서 30일로 분리했습니다. 목록 페이지 캐시 주기는 유지합니다.
- 관리자 변경 시 기존 Wiki 캐시 태그 무효화는 유지되어 변경 사항은 즉시 반영됩니다.
- 검증: `npx tsc --noEmit` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 푸시)

## 2026-09-16 작업 기록 추가

- 사건 상세 페이지(`/events/[id]`)의 ISR 및 상세 데이터 캐시 수명을 24시간에서 30일로 변경했습니다. 사건 본문·대표 이미지·참여자·클립·지도 데이터가 장기 캐시됩니다.
- 관리자 변경 시 기존 Wiki 캐시 태그 무효화는 유지되어 변경 사항은 즉시 반영됩니다.
- 검증: `npx tsc --noEmit` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 푸시)

## 2026-09-17 작업 기록

- BBS 전체 목록에서 서버가 전달한 최신 첫 페이지가 기존 TanStack Query 캐시와 다를 때 첫 페이지만 동기화하도록 수정했습니다. 이미 불러온 뒤쪽 페이지와 무한 스크롤·스크롤 위치 복구 상태는 유지합니다.
- 검증: `npx tsc --noEmit`, `git diff --check` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 푸시 예정)

## 2026-09-17 작업 기록 추가

- BBS 목록 첫 직접 진입 시 필터 활용 안내 말풍선을 표시하도록 추가했습니다. 기사 상세에서 뒤로 돌아온 경우에는 기존 스크롤 복구 상태를 기준으로 표시하지 않으며, 세션 동안 한 번만 노출됩니다.
- 안내 말풍선, 닫기 버튼, 기자 필터 버튼, 일차 필터 버튼을 누르면 안내가 닫히도록 처리했습니다.
- 검증: `git diff --check` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 푸시 예정)

## 2026-09-17 작업 기록 추가

- BBS 기자 필터 드롭다운의 기자 선택 항목 세로 여백을 늘렸습니다. 일차 선택 캐러셀은 적용하지 않고 기존 5열 UI를 유지했습니다.
- 검증: `npx tsc --noEmit`, `git diff --check` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 커밋·푸시)

## 2026-09-17 작업 기록 추가

- 모바일 BBS 기자 필터에서 모든 기자 및 개별 기자 선택 항목의 세로 여백을 늘려 터치 영역을 확장했습니다.
- 검증: `npx tsc --noEmit`, `git diff --check` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 커밋·푸시)

## 2026-09-17 작업 기록 추가

- BBS에서 일차를 선택하면 우측 상단 일차 버튼에 달력 아이콘 대신 선택된 일차 숫자를 표시하도록 개선했습니다. 일차 선택 메뉴와 동일하게 `일차` 글자는 생략합니다.
- 검증: `npx tsc --noEmit`, `git diff --check` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 커밋·푸시)

## 2026-09-18 작업 기록

- 사건에 조직 단위 참여자를 연결할 수 있도록 `event_organizations` 테이블과 마이그레이션을 추가했습니다. 사건 편집 화면에서 조직 검색·추가, 역할 입력·수정, 삭제, 드래그 순서 저장을 지원합니다.
- 공개 사건 상세에는 참여 조직을 캐릭터 참여자와 별도로 표시하고 조직 상세 페이지로 연결했습니다.
- 검증: `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 커밋·푸시 완료)


## 2026-09-18 작업 기록 추가

- BBS 기사 상세를 열람한 기사 ID를 브라우저 로컬 저장소에 기록하고, 목록 카드에 `읽음` 표시를 추가했습니다. 읽은 카드는 회색 효과 없이 투명도만 낮춰 구분합니다.
- 최대 1,000개까지 로컬에 보관하며 서버·Supabase 요청이나 로그인 상태에는 영향을 주지 않습니다.
- 검증: `npx tsc --noEmit`, `git diff --check` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 커밋·푸시 완료)


## 2026-09-19 작업 기록

- 스트리머·캐릭터 목록 검색에서 이름, 별명, 연결된 스트리머명의 공백을 제거한 비교값을 사용하도록 개선했습니다. `A B C`와 `ABC`를 동일하게 검색할 수 있습니다.
- 기존 빨간약 필터와 미정 캐릭터 제외 동작은 유지했습니다.
- 검증: `npx tsc --noEmit`, `git diff --check` 통과.
- 대상 브랜치: `main` (`deploy` 원격으로 커밋·푸시 완료)


## 2026-09-19 제보 DB 접근 제한

- 제보는 입력 검증·차단 확인·속도 제한을 통과한 뒤 서버 서비스 롤로 저장합니다. IP 확인 불가 또는 차단 조회 실패 시 저장하지 않습니다.
- migration 045에서 reports 공개 INSERT 정책과 public/anon/authenticated 테이블 권한을 제거합니다.
- 검증: 정상 등록·IP 누락·차단·차단 조회 실패·속도 제한·제한 조회 실패·입력 오류·저장 실패의 8개 모의 시나리오, TypeScript 및 diff 검사 통과.
- 적용 순서: 서버 코드 배포 완료 후 045_reports_server_only.sql 실행. 운영 DB 적용은 미확인입니다.
- 대상 main → deploy/main. 기록 시점에는 커밋·푸시 준비 상태이며 실제 푸시 결과는 작업 완료 응답에서 확인합니다. 배포 완료는 미확인입니다.

## 2026-09-19 사건 공개 정책 및 IP 판별 보완

- 사건 참여 인물·조직·클립은 부모 사건이 공개된 경우에만 조회하도록 schema.sql 및 migration 047을 수정했습니다. 서비스 롤 관리자 접근은 유지합니다.
- migration 046은 기존 blocked_ips.ip 데이터는 보존하고 NOT NULL만 해제합니다. ip 컬럼이 제거된 환경에서는 건너뜁니다.
- IP 판별은 Vercel 전용 헤더 우선, 임의 프록시 헤더 무시, 비정상 값 거절로 변경했습니다. 로컬 개발은 localhost 식별자를 사용하며 Vercel 외 운영 환경은 IP 확인을 거절합니다.
- 검증: PGlite 공개/비공개·관리자 조회 및 등록·공개 해제·047 재실행 통과. IP 판별 10개 모의 시나리오, TypeScript 및 diff 검사 통과. 프로젝트 소스·SQL 주석의 일본어/한자 검색 결과 없음.
- 사용자 확인: 제보 보안 배포 및 045 적용 완료, IP 해시 차단 정상 동작. 047 운영 적용 완료는 별도 확인하지 않았습니다.
- 대상 main → deploy/main. 기록 시점은 커밋·푸시 준비 상태이며 실제 결과는 완료 응답에서 확인합니다. IP 판별 변경은 재배포가 필요합니다.

## 2026-09-19 지도 색상 보안 검증

- 조직·주요 장소 저장 시 #RRGGBB 형식만 허용하며, 공개 지도·조직 미니맵·관리자 지도는 잘못된 기존 색상을 기본색으로 표시합니다.
- SVG 아이콘 생성 시 색상을 다시 검증하고, 거점·사업체 수정은 허용 필드만 DB에 전달해 임의 색상 필드 삽입을 차단합니다.
- 검증: 정상·악성 색상값, 4개 관리자 저장 함수, 5개 SVG 생성 함수 검증 통과. npx tsc --noEmit 및 git diff --check 통과.
- 대상 main → deploy/main. 기록 시점에는 커밋·푸시 준비 상태이며 실제 푸시 결과는 완료 응답에서 확인합니다. 재배포 필요, 마이그레이션 불필요. 배포 완료는 미확인입니다.

## 2026-09-19 관리자 로그인 시도 제한

- 같은 IP 해시에서 15분당 최대 5회 로그인 시도를 허용합니다. 성공·실패 모두 시도 횟수에 포함하며 초과 시 남은 대기 시간을 표시합니다.
- DB 원자적 upsert로 횟수를 관리하고, IP 확인·DB 검사·환경변수 설정 실패 시 로그인 쿠키를 발급하지 않습니다. 비밀번호와 원본 IP는 제한 테이블에 저장하지 않습니다.
- 검증: PGlite 5회 허용·후속 차단·기간 만료 초기화·공개 권한 거절·잘못된 해시·마이그레이션 재실행 통과. 로그인 6개 모의 시나리오 및 TypeScript·diff 검사 통과.
- 적용 순서: migration 048을 먼저 실행한 뒤 코드 배포. 운영 migration 적용 완료는 미확인입니다.
- 대상 main → deploy/main. 기록 시점은 커밋·푸시 준비 상태이며 실제 푸시 결과는 완료 응답에서 확인합니다. 배포 완료는 미확인입니다.

## 2026-09-19 사건 참여 조직 표시·관련 사건 보완

- 사건 편집 화면과 공개 사건 상세에서 조직 카테고리를 `시청`, `공무직`, `갱단`, `사업체`, `불법 사업체` 한글 라벨로 표시하도록 공통 라벨을 연결했습니다.
- 조직 상세의 관련 사건 조회가 조직 멤버 캐릭터를 통한 사건뿐 아니라 `event_organizations`로 직접 연결된 사건도 포함하도록 수정하고, 중복 사건을 제거한 뒤 공개 사건만 최신순으로 표시합니다.
- 검증: `npx tsc --noEmit`, `npm run build`, `git diff --check` 통과. Supabase MCP 원격 SQL 검증은 인증 scope 부족으로 실행하지 못했습니다.
- 대상 브랜치: `main`. 커밋 후 `deploy/main` 푸시 결과를 확인할 예정입니다.
