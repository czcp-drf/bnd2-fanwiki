-- 앱 서버 배포 후 적용: 공개 DB API를 통한 제보 검증 우회를 차단합니다.
begin;

alter table public.reports enable row level security;
drop policy if exists "public insert reports" on public.reports;
revoke all on table public.reports from public, anon, authenticated;
grant select, insert, update, delete on table public.reports to service_role;

notify pgrst, 'reload schema';
commit;
