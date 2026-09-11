-- IP 차단 목록 테이블
CREATE TABLE blocked_ips (
  id         uuid primary key default gen_random_uuid(),
  ip         text not null unique,
  reason     text,
  created_at timestamptz default now()
);

-- 서비스 롤만 접근 (RLS 미적용 — 어드민 전용)
