ALTER TABLE map_locations
  DROP CONSTRAINT IF EXISTS map_locations_wiki_path_check;

ALTER TABLE map_locations
  ADD CONSTRAINT map_locations_wiki_path_check
  CHECK (wiki_path IS NULL OR (wiki_path ~* '^https?://[^[:space:]]+$' AND char_length(wiki_path) <= 2000));

ALTER TABLE organizations
  ADD COLUMN hq_wiki_path text;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_hq_wiki_path_check
  CHECK (hq_wiki_path IS NULL OR (hq_wiki_path ~* '^https?://[^[:space:]]+$' AND char_length(hq_wiki_path) <= 2000));
