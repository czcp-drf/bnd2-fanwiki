-- 비공개 사건의 관련 정보를 공개 API에서 조회하지 못하도록 제한합니다.
-- service_role을 사용하는 관리자 조회·수정은 유지됩니다.
begin;

alter table public.event_participants enable row level security;
alter table public.event_organizations enable row level security;
alter table public.event_clips enable row level security;

drop policy if exists "public read event_participants" on public.event_participants;
create policy "public read event_participants" on public.event_participants for select using (
  exists (select 1 from public.events where events.id = event_participants.event_id and events.is_published = true)
);

drop policy if exists "public read event_organizations" on public.event_organizations;
create policy "public read event_organizations" on public.event_organizations for select using (
  exists (select 1 from public.events where events.id = event_organizations.event_id and events.is_published = true)
);

drop policy if exists "public read event_clips" on public.event_clips;
create policy "public read event_clips" on public.event_clips for select using (
  exists (select 1 from public.events where events.id = event_clips.event_id and events.is_published = true)
);

notify pgrst, 'reload schema';
commit;
