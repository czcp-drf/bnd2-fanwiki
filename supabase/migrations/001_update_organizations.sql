-- organizations 테이블 수정
-- Supabase SQL Editor에서 실행

-- 기존 type 제약 제거
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_type_check;

-- category 컬럼 추가 (공무직 / 사업체 / 불법 사업체)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS category text
  CHECK (category IN ('public_service', 'business', 'illegal'));

-- 사업체명 확정 여부 (미정 표시용)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS name_confirmed boolean DEFAULT true;

-- type 제약 새로 추가
ALTER TABLE organizations
  ADD CONSTRAINT organizations_type_check
  CHECK (type IN (
    'police', 'ems', 'journalist', 'traffic',
    'restaurant_chinese', 'restaurant_japanese', 'restaurant_western', 'restaurant_cafe',
    'tuning', 'farming', 'fishing',
    'information_dealer', 'gunsmith', 'money_laundering', 'smuggling',
    'black_market', 'illegal_medical', 'illegal_tuning',
    'other'
  ));
