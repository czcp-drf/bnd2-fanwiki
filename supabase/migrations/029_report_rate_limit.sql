-- 공개 제보 요청 속도 제한
-- 같은 IP 해시에서 제보를 30초에 한 번으로 제한한다.
begin;

create table if not exists public.report_rate_limits (
  ip_hash          text primary key,
  last_request_at  timestamptz not null default now(),
  constraint report_rate_limits_ip_hash_length check (char_length(ip_hash) = 64)
);

alter table public.report_rate_limits enable row level security;

create or replace function public.check_report_rate_limit(
  p_ip_hash text,
  p_window_ms integer default 30000
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted boolean;
begin
  if p_ip_hash is null or char_length(p_ip_hash) <> 64 then
    raise exception 'invalid ip hash';
  end if;

  if p_window_ms < 1000 then
    raise exception 'invalid rate limit window';
  end if;

  insert into public.report_rate_limits (ip_hash, last_request_at)
  values (p_ip_hash, now())
  on conflict (ip_hash) do update
    set last_request_at = excluded.last_request_at
    where public.report_rate_limits.last_request_at
      <= now() - (p_window_ms * interval '1 millisecond')
  returning true into accepted;

  return coalesce(accepted, false);
end;
$$;

revoke all on table public.report_rate_limits from public, anon, authenticated;
revoke all on function public.check_report_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.check_report_rate_limit(text, integer) to service_role;

comment on table public.report_rate_limits is 'Public report request throttle state; keyed by hashed IP';
comment on column public.report_rate_limits.ip_hash is 'SHA-256 hash of the client IP; raw IP is never stored';

notify pgrst, 'reload schema';
commit;
