-- 봉누도2 초기 조직 데이터
-- migrations/001_update_organizations.sql 실행 후 이걸 실행

INSERT INTO organizations (name, type, category, color, is_active, name_confirmed) VALUES

-- 공무직
('봉누도경찰청', 'police',              'public_service', '#3B82F6', true, true),
('병원',         'ems',                 'public_service', '#EF4444', true, true),
('봉누도방송국', 'journalist',          'public_service', '#A855F7', true, true),
('교통정비공사', 'traffic',             'public_service', '#F59E0B', true, true),

-- 사업체 (미정)
('(중식당)',     'restaurant_chinese',  'business',       '#EF4444', true, false),
('(일식당)',     'restaurant_japanese', 'business',       '#F97316', true, false),
('(양식당)',     'restaurant_western',  'business',       '#8B5CF6', true, false),
('(카페)',       'restaurant_cafe',     'business',       '#78716C', true, false),
('(튜닝소 1)',   'tuning',              'business',       '#06B6D4', true, false),
('(튜닝소 2)',   'tuning',              'business',       '#0EA5E9', true, false),
('(농장 1)',     'farming',             'business',       '#22C55E', true, false),
('(농장 2)',     'farming',             'business',       '#16A34A', true, false),
('(어부 사업체)','fishing',             'business',       '#0891B2', true, false),

-- 불법 사업체
('위스퍼',       'information_dealer',  'illegal',        '#6B7280', true, true),
('(총기 제작 1)','gunsmith',            'illegal',        '#DC2626', true, false),
('(총기 제작 2)','gunsmith',            'illegal',        '#B91C1C', true, false),
('(자금 세탁)',  'money_laundering',    'illegal',        '#D97706', true, false),
('(밀수업체)',   'smuggling',           'illegal',        '#92400E', true, false),
('(블랙마켓)',   'black_market',        'illegal',        '#1F2937', true, false),
('판도라 연구소','illegal_medical',     'illegal',        '#7C3AED', true, true),
('(불법 튜닝소)','illegal_tuning',      'illegal',        '#374151', true, false);
