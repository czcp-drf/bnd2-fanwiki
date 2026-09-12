ALTER TABLE event_participants ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
