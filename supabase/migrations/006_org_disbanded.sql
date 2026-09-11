-- 조직 해체 상태 컬럼 추가
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS is_disbanded boolean DEFAULT false;
