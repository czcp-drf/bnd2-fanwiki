-- reports 테이블에 연락 방법 컬럼 추가
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS contact_method text;
