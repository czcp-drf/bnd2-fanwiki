-- 시청 type 및 category 추가
-- Supabase SQL Editor에서 실행

-- type 제약 업데이트 (city_hall 추가)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_type_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_type_check
  CHECK (type IN (
    'police', 'ems', 'journalist', 'traffic', 'city_hall',
    'restaurant_chinese', 'restaurant_japanese', 'restaurant_western', 'restaurant_cafe',
    'tuning', 'farming', 'fishing',
    'information_dealer', 'gunsmith', 'money_laundering', 'smuggling',
    'black_market', 'illegal_medical', 'illegal_tuning',
    'other'
  ));

-- category 제약 업데이트 (city_hall 추가)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_category_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_category_check
  CHECK (category IN ('city_hall', 'public_service', 'business', 'illegal'));

-- 시청 데이터 삽입
INSERT INTO organizations (name, type, category, color, is_active, name_confirmed)
VALUES ('시청', 'city_hall', 'city_hall', '#6366F1', true, true);
