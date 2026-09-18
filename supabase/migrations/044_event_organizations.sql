-- 사건에 조직 단위 참여자를 연결합니다.
CREATE TABLE IF NOT EXISTS event_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (event_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_event_organizations_event_id ON event_organizations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizations_organization_id ON event_organizations(organization_id);

ALTER TABLE event_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read event_organizations" ON event_organizations;
CREATE POLICY "public read event_organizations" ON event_organizations FOR SELECT USING (true);
