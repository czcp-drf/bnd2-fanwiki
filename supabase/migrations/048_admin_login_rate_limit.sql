-- 동일 IP 해시에서 15분간 최대 5회 로그인 시도를 허용합니다.
begin;

create table if not exists public.admin_login_rate_limits (
  ip_hash text primary key check (ip_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  attempts integer not null check (attempts between 1 and 6)
);
alter table public.admin_login_rate_limits enable row level security;

-- 허용 시 0, 제한 시 남은 대기 시간(초)을 반환합니다.
create or replace function public.check_admin_login_rate_limit(p_ip_hash text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  checked_at timestamptz := clock_timestamp();
  current_attempts integer;
  started_at timestamptz;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid ip hash';
  end if;

  insert into public.admin_login_rate_limits as limits (ip_hash, window_started_at, attempts)
  values (p_ip_hash, checked_at, 1)
  on conflict (ip_hash) do update set
    window_started_at = case when limits.window_started_at <= checked_at - interval '15 minutes'
      then checked_at else limits.window_started_at end,
    attempts = case when limits.window_started_at <= checked_at - interval '15 minutes'
      then 1 else least(limits.attempts + 1, 6) end
  returning attempts, window_started_at into current_attempts, started_at;

  if current_attempts <= 5 then return 0; end if;
  return greatest(1, ceil(extract(epoch from (started_at + interval '15 minutes' - checked_at)))::integer);
end;
$$;

revoke all on table public.admin_login_rate_limits from public, anon, authenticated;
revoke all on function public.check_admin_login_rate_limit(text) from public, anon, authenticated;
grant execute on function public.check_admin_login_rate_limit(text) to service_role;

notify pgrst, 'reload schema';
commit;
