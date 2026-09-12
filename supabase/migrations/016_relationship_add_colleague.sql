-- character_relationships.type CHECK 제약에 'colleague' 추가
ALTER TABLE character_relationships
  DROP CONSTRAINT IF EXISTS character_relationships_type_check;

ALTER TABLE character_relationships
  ADD CONSTRAINT character_relationships_type_check
  CHECK (type IN ('friend', 'enemy', 'rival', 'family', 'romantic', 'ally', 'mentor', 'colleague', 'neutral'));
