-- 공무직 캐릭터 및 조직 멤버 데이터
-- 실행 순서: 001 → 002 → seed.sql → 이 파일

-- =====================
-- 시청
-- =====================
INSERT INTO characters (streamer_id, name, job, status) VALUES
  ('db3a1eea-12e5-47f6-b185-5cbb71ba9f32', '미정', '시장', 'active'); -- 남봉

INSERT INTO organization_members (character_id, organization_id, role, is_primary)
SELECT c.id, o.id, '시장', true
FROM characters c, organizations o
WHERE c.streamer_id = 'db3a1eea-12e5-47f6-b185-5cbb71ba9f32'
  AND o.type = 'city_hall';

-- =====================
-- 봉누도경찰청
-- =====================
INSERT INTO characters (streamer_id, name, job, status) VALUES
  ('a769db9d-0190-422e-8465-624e8237b015', '미정', '경찰관', 'active'); -- 고수달

INSERT INTO organization_members (character_id, organization_id, role, is_primary)
SELECT c.id, o.id, '경찰청장', true
FROM characters c, organizations o
WHERE c.streamer_id = 'a769db9d-0190-422e-8465-624e8237b015'
  AND o.type = 'police';

-- =====================
-- 병원
-- =====================
INSERT INTO characters (streamer_id, name, job, status) VALUES
  ('f44ff0ed-a126-4581-9346-6d46c1ac0616', '도현정', '의사', 'active'), -- 강지 (병원장)
  ('a8464729-aff8-4bdf-b50b-623e5f714f40', '미정',   '의사', 'active'), -- 고차비
  ('713083a6-4a9d-4465-9a26-b63424722b2f', '미정',   '의사', 'active'), -- 김총무
  ('f10e3f22-74de-4ca2-95a4-261c5dbd37ba', '미정',   '의사', 'active'), -- RED레드
  ('09def26b-06d3-4e54-b01e-73c3f8bc55f5', '미정',   '의사', 'active'), -- 미유
  ('6604556e-e5ad-48e4-bdc2-2fae39f50878', '미정',   '의사', 'active'), -- 배돈
  ('07ee6433-5175-4597-8b56-b1abe968057b', '미정',   '의사', 'active'), -- 백곰파
  ('6a39ff52-7bb3-45cb-ad8e-1f5d238bb1db', '미정',   '의사', 'active'), -- 그냥 뿌요
  ('9b26deb3-9db9-4224-9bbb-150b0f8f09d0', '미정',   '의사', 'active'), -- 사키하네 후야
  ('ff79b505-8fdb-43b7-895b-8c8ce23d550a', '미정',   '의사', 'active'), -- 스즈 SUZU
  ('7dd39f29-c807-4c17-88a9-aebfc1a84476', '미정',   '의사', 'active'), -- 이글콥
  ('7ece19f8-210f-44b1-8328-d0ccd226b635', '미정',   '의사', 'active'), -- 이초홍
  ('0ec8a99b-4577-4cd0-b88c-8ba71bad13df', '미정',   '의사', 'active'), -- 자몽뀨
  ('5d368f8d-acfd-4886-9de3-dc27736106f4', '미정',   '의사', 'active'), -- 코오리 세라
  ('3adf4211-4b58-4916-9bb3-dc9f52be7101', '미정',   '의사', 'active'), -- 토종 아오리
  ('4d6ff1c1-70d9-4615-96c2-ad20f30918d5', '미정',   '의사', 'active'); -- HERA 헤라

INSERT INTO organization_members (character_id, organization_id, role, is_primary)
SELECT c.id, o.id,
  CASE WHEN c.streamer_id = 'f44ff0ed-a126-4581-9346-6d46c1ac0616' THEN '병원장' ELSE '의료진' END,
  CASE WHEN c.streamer_id = 'f44ff0ed-a126-4581-9346-6d46c1ac0616' THEN true ELSE false END
FROM characters c, organizations o
WHERE c.streamer_id IN (
  'f44ff0ed-a126-4581-9346-6d46c1ac0616',
  'a8464729-aff8-4bdf-b50b-623e5f714f40',
  '713083a6-4a9d-4465-9a26-b63424722b2f',
  'f10e3f22-74de-4ca2-95a4-261c5dbd37ba',
  '09def26b-06d3-4e54-b01e-73c3f8bc55f5',
  '6604556e-e5ad-48e4-bdc2-2fae39f50878',
  '07ee6433-5175-4597-8b56-b1abe968057b',
  '6a39ff52-7bb3-45cb-ad8e-1f5d238bb1db',
  '9b26deb3-9db9-4224-9bbb-150b0f8f09d0',
  'ff79b505-8fdb-43b7-895b-8c8ce23d550a',
  '7dd39f29-c807-4c17-88a9-aebfc1a84476',
  '7ece19f8-210f-44b1-8328-d0ccd226b635',
  '0ec8a99b-4577-4cd0-b88c-8ba71bad13df',
  '5d368f8d-acfd-4886-9de3-dc27736106f4',
  '3adf4211-4b58-4916-9bb3-dc9f52be7101',
  '4d6ff1c1-70d9-4615-96c2-ad20f30918d5'
) AND o.type = 'ems';

-- =====================
-- 봉누도방송국
-- =====================
INSERT INTO characters (streamer_id, name, job, status) VALUES
  ('daccc74b-504b-40cd-ad79-d96f1ab572b2', '이윤진', '기자', 'active'), -- 이춘향 (보도국장)
  ('7b08e5cb-e5f6-49f3-bd1f-920b91ff4e23', '미정',   '기자', 'active'), -- 로마러
  ('24ac8c4d-27dc-4f0c-ac34-1d28900d77b1', '미정',   '기자', 'active'), -- 마레 플로스
  ('6c2c3483-8da0-4504-9671-9ca9f25891f7', '미정',   '기자', 'active'), -- 시라유키 히나
  ('a591ecff-6a90-4f64-8508-f1b1ef08c10c', '미정',   '기자', 'active'), -- 위구리
  ('e209875c-6163-4817-80f2-dbf6721b2209', '미정',   '기자', 'active'), -- 유즈하 리코
  ('f432df8b-c3e6-41ba-9ba9-12ec10b0f5f4', '미정',   '기자', 'active'), -- 장마군
  ('55956639-adbc-4f02-b686-31224878f02f', '미정',   '기자', 'active'), -- 코무키
  ('77878e8b-be95-4feb-9bf2-57c262452733', '미정',   '기자', 'active'), -- 킹설아
  ('b5c88824-2e6e-4d65-bd03-43f00da3cb78', '미정',   '기자', 'active'); -- 티뭉

INSERT INTO organization_members (character_id, organization_id, role, is_primary)
SELECT c.id, o.id,
  CASE WHEN c.streamer_id = 'daccc74b-504b-40cd-ad79-d96f1ab572b2' THEN '보도국장' ELSE '기자' END,
  CASE WHEN c.streamer_id = 'daccc74b-504b-40cd-ad79-d96f1ab572b2' THEN true ELSE false END
FROM characters c, organizations o
WHERE c.streamer_id IN (
  'daccc74b-504b-40cd-ad79-d96f1ab572b2',
  '7b08e5cb-e5f6-49f3-bd1f-920b91ff4e23',
  '24ac8c4d-27dc-4f0c-ac34-1d28900d77b1',
  '6c2c3483-8da0-4504-9671-9ca9f25891f7',
  'a591ecff-6a90-4f64-8508-f1b1ef08c10c',
  'e209875c-6163-4817-80f2-dbf6721b2209',
  'f432df8b-c3e6-41ba-9ba9-12ec10b0f5f4',
  '55956639-adbc-4f02-b686-31224878f02f',
  '77878e8b-be95-4feb-9bf2-57c262452733',
  'b5c88824-2e6e-4d65-bd03-43f00da3cb78'
) AND o.type = 'journalist';

-- =====================
-- 교통정비공사
-- =====================
INSERT INTO characters (streamer_id, name, job, status) VALUES
  ('2f09f107-111b-4e89-bb85-b533db32bdf2', '미정', '교통정비원', 'active'), -- 너불 (교통정비국장)
  ('411292c6-0c99-4219-b6f0-6b216a36c01d', '미정', '교통정비원', 'active'), -- 김뿡
  ('d942d232-03ee-4e75-9004-9f76bdcf72db', '미정', '교통정비원', 'active'), -- 달콤레나 씨
  ('f9e49ec7-dfde-42f4-b374-2a6246e8f13f', '미정', '교통정비원', 'active'), -- 바테바테
  ('7efaea4d-d2cb-4cbb-bb33-ae528d7f4818', '미정', '교통정비원', 'active'), -- 아로AURO
  ('47fa9af0-abab-433d-93a3-dbd785c4c3b9', '미정', '교통정비원', 'active'), -- 앵보
  ('f9aeeb32-3ca0-4d78-9532-a161435a043a', '미정', '교통정비원', 'active'), -- 채현찌
  ('8aaa8ff0-eb9a-4257-a4b2-27e641290f30', '미정', '교통정비원', 'active'), -- 치치 planeta
  ('2c4758fc-0f8a-409f-a5a9-0640ba49a405', '미정', '교통정비원', 'active'), -- 카토kato
  ('d6b2f6ae-31e5-4337-872f-d2445b81d290', '미정', '교통정비원', 'active'), -- 호시에 제로
  ('17dbcd5e-987b-4d50-9617-e36b2a1d59cd', '미정', '교통정비원', 'active'); -- 후추

INSERT INTO organization_members (character_id, organization_id, role, is_primary)
SELECT c.id, o.id,
  CASE WHEN c.streamer_id = '2f09f107-111b-4e89-bb85-b533db32bdf2' THEN '교통정비국장' ELSE '정비원' END,
  CASE WHEN c.streamer_id = '2f09f107-111b-4e89-bb85-b533db32bdf2' THEN true ELSE false END
FROM characters c, organizations o
WHERE c.streamer_id IN (
  '2f09f107-111b-4e89-bb85-b533db32bdf2',
  '411292c6-0c99-4219-b6f0-6b216a36c01d',
  'd942d232-03ee-4e75-9004-9f76bdcf72db',
  'f9e49ec7-dfde-42f4-b374-2a6246e8f13f',
  '7efaea4d-d2cb-4cbb-bb33-ae528d7f4818',
  '47fa9af0-abab-433d-93a3-dbd785c4c3b9',
  'f9aeeb32-3ca0-4d78-9532-a161435a043a',
  '8aaa8ff0-eb9a-4257-a4b2-27e641290f30',
  '2c4758fc-0f8a-409f-a5a9-0640ba49a405',
  'd6b2f6ae-31e5-4337-872f-d2445b81d290',
  '17dbcd5e-987b-4d50-9617-e36b2a1d59cd'
) AND o.type = 'traffic';
