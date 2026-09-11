CREATE TABLE map_locations (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  label       text,
  description text,
  color       text        NOT NULL DEFAULT '#facc15',
  x           float,
  y           float,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE map_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read map_locations" ON map_locations FOR SELECT USING (true);
