-- BBS 기사별 리액션 요청 속도 제한
-- 같은 IP 해시가 같은 기사에 좋아요·싫어요를 30초에 한 번만 요청하도록 제한한다.
begin;

create table if not exists public.bbs_article_reaction_rate_limits (
  article_id       uuid not null references public.bbs_articles(id) on delete cascade,
  ip_hash          text not null,
  last_request_at  timestamptz not null default now(),
  primary key (article_id, ip_hash),
  constraint bbs_article_reaction_rate_limits_ip_hash_length check (char_length(ip_hash) = 64)
);

alter table public.bbs_article_reaction_rate_limits enable row level security;

create or replace function public.check_bbs_article_reaction_rate_limit(
  p_article_id uuid,
  p_ip_hash text,
  p_window_seconds integer default 30
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted boolean;
begin
  if p_article_id is null or p_ip_hash is null or char_length(p_ip_hash) <> 64 then
    raise exception 'invalid reaction rate limit input';
  end if;

  if p_window_seconds < 1 then
    raise exception 'invalid rate limit window';
  end if;

  insert into public.bbs_article_reaction_rate_limits (article_id, ip_hash, last_request_at)
  values (p_article_id, p_ip_hash, now())
  on conflict (article_id, ip_hash) do update
    set last_request_at = excluded.last_request_at
    where public.bbs_article_reaction_rate_limits.last_request_at
      <= now() - (p_window_seconds * interval '1 second')
  returning true into accepted;

  return coalesce(accepted, false);
end;
$$;

revoke all on table public.bbs_article_reaction_rate_limits from public, anon, authenticated;
revoke all on function public.check_bbs_article_reaction_rate_limit(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.check_bbs_article_reaction_rate_limit(uuid, text, integer) to service_role;

comment on table public.bbs_article_reaction_rate_limits is 'BBS article reaction throttle state; keyed by article and hashed IP';
comment on column public.bbs_article_reaction_rate_limits.ip_hash is 'SHA-256 hash of the client IP; raw IP is never stored';

notify pgrst, 'reload schema';
commit;
