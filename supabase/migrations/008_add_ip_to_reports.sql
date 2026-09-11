-- reports 테이블에 IP 주소 컬럼 추가 (레이트 리밋용)
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS ip text;

CREATE INDEX IF NOT EXISTS reports_ip_created_at ON reports(ip, created_at DESC);
