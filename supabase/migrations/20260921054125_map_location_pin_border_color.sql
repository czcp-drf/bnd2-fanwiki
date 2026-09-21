-- 주요 장소 지도 핀 외곽선 색상. NULL이면 공개 지도에서 핀 색상 대비를 자동 계산한다.
alter table public.map_locations
  add column if not exists pin_border_color text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'map_locations_pin_border_color_hex_check'
      and conrelid = 'public.map_locations'::regclass
  ) then
    alter table public.map_locations
      add constraint map_locations_pin_border_color_hex_check
      check (pin_border_color is null or pin_border_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;
end;
$$;

comment on column public.map_locations.pin_border_color is 'Public map marker outline color in #RRGGBB format; NULL uses automatic contrast.';
