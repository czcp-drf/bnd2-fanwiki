# 봉누도2 위키

봉누도2 GTA RP 서버의 팬 제작 위키 사이트입니다.
스트리머, 캐릭터, 조직, 사건, 지도 등의 정보를 아카이빙합니다.

> **비공식 팬 사이트입니다.** 봉누도2 서버 및 원작자와 공식적인 관계가 없습니다.

---

## 주요 기능

- **스트리머** — 참여 스트리머 목록 및 치지직 채널 연결
- **캐릭터** — 등장 캐릭터 정보 (이름, 별명, 직업, 소속 조직)
- **조직** — 서버 내 세력 및 조직 정보
- **사건** — 주요 사건 아카이브 및 참여 인물·클립 정리
- **지도** — GTA V 맵 기반 거점 위치 표시
- **라이브** — 치지직 실시간 방송 상태 연동
- **빨간약 / 파란약** — 스트리머↔캐릭터 정보 표시 토글
- **제보** — 커뮤니티 정보 제보 양식

---

## 기술 스택

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Map:** Leaflet + 커스텀 GTA V CRS
- **Deployment:** Vercel

---

## 로컬 실행

### 1. 환경 변수 설정

`.env.local.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
ADMIN_TOKEN=...
```

### 2. 패키지 설치 및 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

---

## 라이선스

본 프로젝트는 팬 제작 비영리 아카이빙 사이트입니다.
콘텐츠 저작권은 봉누도2 서버 및 각 스트리머에게 있습니다.
