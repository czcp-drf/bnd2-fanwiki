ALTER TABLE map_locations
  ADD COLUMN wiki_path text;

ALTER TABLE map_locations
  ADD CONSTRAINT map_locations_wiki_path_check
  CHECK (wiki_path IS NULL OR (wiki_path LIKE '/%' AND wiki_path NOT LIKE '//%' AND char_length(wiki_path) <= 500));
