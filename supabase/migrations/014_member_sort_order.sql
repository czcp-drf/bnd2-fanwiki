ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
