# 봉누도2 위키 — 프로젝트 가이드

## 지도 타일 Storage

- 공개 버킷: `map-tiles`, 경로: `mapStyles/<스타일>/{z}/{x}/{y}.jpg`.
- `NEXT_PUBLIC_MAP_TILE_BASE`는 Supabase 프로젝트 URL 뒤에 `/storage/v1/object/public/map-tiles`를 붙인 값입니다. 변경 후 개발 서버 재시작 또는 배포 재빌드가 필요합니다.
- 업로드: `node --env-file=.env.local scripts/upload-map-tiles.mjs` (Node 22 이상). 기존 파일은 덮어쓰지 않고 건너뛰며, 실패한 업로드는 재시도합니다.
- 업로드용 `SUPABASE_SERVICE_ROLE_KEY`는 로컬 서버 환경에서만 사용합니다.

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
| 아이콘 | lucide-react |
| 배포 | Vercel (예정) |

---

## 디렉토리 구조

```
src/
├── app/                        # Next.js App Router 페이지
│   ├── page.tsx                # 홈 (통계, 라이브 바로가기, 최근 사건)
│   ├── live/page.tsx           # 라이브 전용 페이지
│   ├── streamers/              # 스트리머 목록 / 상세
│   ├── characters/             # 캐릭터 목록 / 상세
│   ├── organizations/          # 조직 목록 / 상세
│   ├── events/                 # 사건 목록 / 상세 / 연대표
│   ├── search/page.tsx         # 통합 검색
│   ├── schedule/               # 방송 일정
│   ├── guide/                  # 입문 가이드
│   ├── report/                 # 제보 폼
│   ├── api/
│   │   └── live-status/route.ts  # Chzzk 라이브 상태 API
│   └── admin/                  # 관리자 페이지 (로그인 필요)
│       ├── page.tsx            # 대시보드
│       ├── characters/         # 캐릭터 CRUD
│       ├── organizations/      # 조직 CRUD
│       ├── events/             # 사건 CRUD + 참여자/클립 편집
│       ├── relationships/      # 캐릭터 관계 CRUD
│       └── reports/            # 제보 관리
│
├── components/
│   ├── layout/Header.tsx       # 글로벌 네비게이션 (빨간약 토글 포함)
│   ├── ui/
│   │   ├── StreamerMask.tsx    # StreamerReveal / StreamerBlur 컴포넌트
│   │   ├── AppImage.tsx        # 이미지 컴포넌트
│   │   ├── Select.tsx          # 커스텀 셀렉트
│   │   └── DropdownPortal.tsx
│   ├── streamers/
│   │   └── StreamerListWithLive.tsx  # 온라인/오프라인/비활동 분류 카드 리스트
│   ├── events/
│   │   ├── TimelineView.tsx    # 연대표 (가로/세로 모드)
│   │   ├── TimelineFilters.tsx # 연대표 필터
│   │   ├── EventTypeFilter.tsx
│   │   └── ClipLabel.tsx       # 클립 라벨 스트리머명↔캐릭터명 치환
│   ├── home/                   # 홈 전용 컴포넌트
│   ├── live/
│   │   └── LiveDataError.tsx   # 라이브 데이터 로드 실패 UI
│   └── report/ReportForm.tsx
│
└── lib/
    ├── context/RedPillContext.tsx   # 빨간약 전역 상태
    ├── events.ts                    # typeLabel / typeColor 공유 상수
    ├── live/
    │   ├── status.ts                # LiveStatus 타입, checkChannelLive()
    │   └── useLiveStatus.ts         # 라이브 상태 훅 (60초 자동갱신)
    ├── data/
    │   ├── live-streamers.ts        # getLiveStreamers() 서버사이드 데이터
    │   └── organizations.ts         # getOrganizationFilterOptions()
    └── supabase/
        ├── server.ts               # 서버 클라이언트
        ├── client.ts               # 클라이언트 클라이언트
        └── admin.ts                # 서비스 롤 클라이언트 (어드민 전용)
```

---

## 핵심 개념

### 빨간약 (RedPill) 토글
- `RedPillContext` — 전역 boolean 상태, localStorage 유지
- **OFF (기본)**: 스트리머 정보 숨김, 캐릭터 정보만 표시
- **ON**: 스트리머 이름/이미지 공개
- `StreamerReveal`: RedPill OFF 시 자식 숨김
- `StreamerBlur`: RedPill OFF 시 자식 블러 처리 (숨기지는 않음)

### 라이브 상태
- `/api/live-status?ids=...` — Chzzk API 호출 (v3.3 → v2 폴백)
- `live: true` = 방송 중, `live: false` = 오프라인, `live: null` = 확인 불가
- `useLiveStatus` 훅 — 60초 자동갱신, 탭 숨김 시 일시정지, retry 지원
- 채널 ID 형식: 32자 소문자 hex

### 어드민 인증
- 쿠키 기반 토큰 인증 (`ADMIN_PASSWORD`, `ADMIN_TOKEN` 환경변수)
- `requireAdmin()` — 쿠키 검증 후 미인증 시 `/admin/login` 리다이렉트
- `src/proxy.ts` — 미들웨어 파일 (`middleware.ts` 아님, 이 Next.js 버전의 컨벤션)
- `export function proxy()` — 미들웨어 함수명
- `/admin/*` 전체 보호, `/admin/login` 제외

---

## DB 주요 테이블

| 테이블 | 설명 |
|---|---|
| `streamers` | 스트리머 (chzzk_channel_id, display_name, is_active) |
| `characters` | RP 캐릭터 (name, alias[], job, status, avatar_url) |
| `organization_members` | 캐릭터↔조직 N:M (role, is_primary, joined_at, left_at) |
| `organizations` | 조직 (category: city_hall/public_service/gang/business/illegal) |
| `events` | 사건 아카이브 (type, occurred_at, is_published) |
| `event_participants` | 사건↔캐릭터 N:M (role) |
| `event_clips` | 사건 클립 (url, label, streamer_id) |
| `character_relationships` | 캐릭터 관계 (type: friend/enemy/rival/family/romantic/ally/mentor/neutral) |
| `reports` | 제보 (status: pending/reviewed/done) |

---

## 구현 완료 기능

### 공개 페이지
- [x] 홈 — 통계, 라이브 바로가기, 최근 사건, 빠른 링크
- [x] `/live` — 온라인/오프라인 실시간 분류, 조직 필터
- [x] `/streamers` — 목록 (라이브 확인 없이 디렉토리 형태)
- [x] `/streamers/[id]` — 스트리머 상세
- [x] `/characters` — 목록 + 필터
- [x] `/characters/[id]` — 상세 (소속 조직, 인물 관계, 참여 사건)
- [x] `/organizations` — 목록 (갱단/공무직/사업체)
- [x] `/organizations/[id]` — 상세 (멤버, 운영 사업체, 관련 사건)
- [x] `/events` — 목록 + 타입 필터
- [x] `/events/[id]` — 상세 (참여자, 클립)
- [x] `/events/timeline` — 연대표 (가로/세로, 캐릭터/조직/전체 필터)
- [x] `/search` — 통합 검색 (캐릭터/스트리머/사건/조직, 조직·사건 확장 카드)
- [x] `/schedule`, `/guide`, `/report`

### 어드민
- [x] 대시보드 — 통계, 미정 캐릭터·미처리 제보 바로가기
- [x] 캐릭터/조직/사건/관계/제보 CRUD
- [x] 사건 인라인 삭제 (2단계 확인)

---

## 코딩 컨벤션

- 서버 컴포넌트 기본, 상호작용 필요 시 `'use client'`
- 공유 상수는 `src/lib/` 아래 별도 파일로 분리 (`events.ts` 등)
- Supabase 쿼리는 서버 컴포넌트/서버 액션에서만 직접 실행
- 클라이언트에서 DB가 필요하면 API Route 경유
- 타입은 inline으로, 재사용 필요 시 `src/types/database.ts` 참조
- 이미지는 `AppImage` 컴포넌트 사용 (외부 URL 허용)
