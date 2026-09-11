-- 갱단 카테고리 추가 및 불법 사업체-갱단 연결 컬럼 추가

-- category 제약 재설정 (gang 추가)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_category_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_category_check
  CHECK (category IN ('city_hall', 'public_service', 'business', 'illegal', 'gang'));

-- 불법 사업체 → 운영 갱단 연결 (nullable)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS gang_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_gang_id ON organizations(gang_id);
