-- 제보·차단 목록의 IP 원문 대신 서버 비밀키 기반 해시를 사용한다.
--
-- 기존 ip 컬럼은 운영 데이터 백필이 끝날 때까지 보존한다.
-- scripts/migrate-report-ip-hashes.mjs 실행 후 ip 값이 모두 이전되었는지
-- 확인하고, 별도 정리 migration에서 원문 컬럼을 제거한다.
begin;

alter table public.reports
  add column if not exists ip_hash text;

alter table public.blocked_ips
  add column if not exists ip_hash text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_ip_hash_length'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_ip_hash_length
      check (ip_hash is null or char_length(ip_hash) = 64);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'blocked_ips_ip_hash_length'
      and conrelid = 'public.blocked_ips'::regclass
  ) then
    alter table public.blocked_ips
      add constraint blocked_ips_ip_hash_length
      check (char_length(ip_hash) = 64);
  end if;
end $$;

create index if not exists reports_ip_hash_created_at
  on public.reports(ip_hash, created_at desc);

create unique index if not exists blocked_ips_ip_hash_unique
  on public.blocked_ips(ip_hash);

comment on column public.reports.ip_hash is
  'Server-secret SHA-256 hash of the submitter IP; raw IP is legacy-only during migration';
comment on column public.blocked_ips.ip_hash is
  'Server-secret SHA-256 hash of the blocked IP; raw IP is legacy-only during migration';

notify pgrst, 'reload schema';
commit;
