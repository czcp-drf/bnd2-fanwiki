-- 조직 불법 사업체 위치 (거점과 별도, 1:1)
ALTER TABLE organizations
  ADD COLUMN biz_x float,
  ADD COLUMN biz_y float,
  ADD COLUMN biz_label text;
