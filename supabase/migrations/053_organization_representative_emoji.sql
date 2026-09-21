-- 조직 대표 이모지
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS emoji text;

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_emoji_length_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_emoji_length_check
  CHECK (emoji IS NULL OR char_length(btrim(emoji)) BETWEEN 1 AND 16);

COMMENT ON COLUMN public.organizations.emoji IS '조직을 대표하는 이모지';
