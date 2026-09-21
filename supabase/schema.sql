-- 봉누도2 팬사이트 DB 스키마
-- Supabase SQL Editor에서 실행

-- streamers
create table streamers (
  id                uuid primary key default gen_random_uuid(),
  chzzk_channel_id  text unique not null,
  display_name      text not null,
  profile_image_url text,
  is_active         boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- characters
create table characters (
  id             uuid primary key default gen_random_uuid(),
  streamer_id    uuid references streamers(id) on delete cascade,
  name           text not null,
  is_name_pending boolean not null default false,
  alias          text[],
  avatar_url     text,
  job            text,
  description    text,
  status         text default 'active'
                 check (status in ('active', 'dead', 'retired', 'hiatus')),
  first_appeared date,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- organizations
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text check (type in (
                'police', 'gang', 'medical', 'legal',
                'government', 'civilian', 'other'
              )),
  description text,
  logo_url    text,
  emoji       text check (emoji is null or char_length(btrim(emoji)) between 1 and 16),
  color       text,
  pin_border_color text,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- organization_members
create table organization_members (
  id              uuid primary key default gen_random_uuid(),
  character_id    uuid references characters(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  role            text,
  is_primary      boolean default true,
  joined_at       date,
  left_at         date,
  unique (character_id, organization_id)
);

-- character_relationships
create table character_relationships (
  id             uuid primary key default gen_random_uuid(),
  character_a_id uuid references characters(id) on delete cascade,
  character_b_id uuid references characters(id) on delete cascade,
  type           text check (type in (
                   'friend', 'enemy', 'rival', 'family',
                   'romantic', 'ally', 'mentor', 'colleague', 'neutral'
                 )),
  description    text,
  created_at     timestamptz default now(),
  check (character_a_id < character_b_id)
);

-- events
create table events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  summary       text,
  content       text,
  type          text check (type in (
                  'war', 'crime', 'political',
                  'social', 'accident', 'other'
                )),
  thumbnail_url text,
  occurred_at   timestamptz,
  is_published  boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- event_participants
create table event_participants (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references events(id) on delete cascade,
  character_id uuid references characters(id) on delete cascade,
  role         text,
  unique (event_id, character_id)
);

-- event_clips
create table event_clips (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references events(id) on delete cascade,
  streamer_id uuid references streamers(id),
  clip_url    text not null,
  label       text,
  sort_order  int default 0
);

-- reports
create table reports (
  id            uuid primary key default gen_random_uuid(),
  type          text check (type in (
                  'new_character', 'new_event', 'correction', 'other'
                )),
  title         text not null,
  content       text not null,
  contact       text,
  contact_method text,
  reference_url text,
  status        text default 'pending'
                check (status in ('pending', 'reviewing', 'applied', 'rejected')),
  ip_hash       text check (ip_hash is null or char_length(ip_hash) = 64),
  created_at    timestamptz default now()
);

-- event_organizations
create table event_organizations (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role           text,
  sort_order     int not null default 0,
  unique (event_id, organization_id)
);

-- blocked IP hashes
create table blocked_ips (
  id            uuid primary key default gen_random_uuid(),
  ip_hash       text not null unique check (char_length(ip_hash) = 64),
  reason        text,
  created_at    timestamptz default now()
);

-- 인덱스
create index on characters(streamer_id);
create index on characters(status);
create index on organization_members(organization_id);
create index on event_participants(event_id);
create index on event_participants(character_id);
create index on events(occurred_at desc);
create index on events(is_published);
create index on reports(status);
create index on reports(ip_hash, created_at desc);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger streamers_updated_at before update on streamers
  for each row execute function update_updated_at();
create trigger characters_updated_at before update on characters
  for each row execute function update_updated_at();
create trigger organizations_updated_at before update on organizations
  for each row execute function update_updated_at();
create trigger events_updated_at before update on events
  for each row execute function update_updated_at();

-- RLS (Row Level Security) - 공개 읽기, 서비스 롤만 쓰기
alter table streamers enable row level security;
alter table characters enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table character_relationships enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table event_organizations enable row level security;
alter table event_clips enable row level security;
alter table reports enable row level security;

-- 공개 읽기 정책
create policy "public read streamers" on streamers for select using (true);
create policy "public read characters" on characters for select using (true);
create policy "public read organizations" on organizations for select using (true);
create policy "public read organization_members" on organization_members for select using (true);
create policy "public read character_relationships" on character_relationships for select using (true);
create policy "public read events" on events for select using (is_published = true);
create policy "public read event_participants" on event_participants for select using (
  exists (select 1 from public.events where events.id = event_participants.event_id and events.is_published = true)
);
create policy "public read event_organizations" on event_organizations for select using (
  exists (select 1 from public.events where events.id = event_organizations.event_id and events.is_published = true)
);
create policy "public read event_clips" on event_clips for select using (
  exists (select 1 from public.events where events.id = event_clips.event_id and events.is_published = true)
);

-- 제보는 서버 검증을 통과한 service_role 요청만 저장합니다.
revoke all on table public.reports from public, anon, authenticated;
grant select, insert, update, delete on table public.reports to service_role;

-- bongstagram_profiles
-- 기존 캐릭터 1명당 하나의 Bongstagram 프로필을 보장한다.
create table bongstagram_profiles (
  character_id uuid primary key references characters(id) on delete cascade,
  profile_name text not null,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint bongstagram_profile_name_length
    check (char_length(btrim(profile_name)) between 1 and 40),
  constraint bongstagram_bio_length
    check (bio is null or char_length(bio) <= 150)
);

create trigger bongstagram_profiles_updated_at before update on bongstagram_profiles
  for each row execute function update_updated_at();

alter table bongstagram_profiles enable row level security;
create policy "public read Bongstagram profiles" on bongstagram_profiles for select using (true);

-- bongstagram_posts
-- Bongstagram 프로필에 연결되는 피드 게시물
create table bongstagram_posts (
  id               uuid primary key default gen_random_uuid(),
  character_id     uuid not null references characters(id) on delete cascade,
  post_type        text not null default 'post',
  content          text not null default '',
  posted_at        timestamptz not null default now(),
  story_expires_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint bongstagram_posts_type
    check (post_type in ('post', 'story')),
  constraint bongstagram_posts_content_length
    check (char_length(content) <= 2200)
);

create index bongstagram_posts_character_posted_at_idx on bongstagram_posts(character_id, posted_at desc);
create index bongstagram_posts_posted_at_idx on bongstagram_posts(posted_at desc);

create trigger bongstagram_posts_updated_at before update on bongstagram_posts
  for each row execute function update_updated_at();

create table bongstagram_post_media (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references bongstagram_posts(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  media_url  text not null check (media_url ~* '^https?://'),
  storage_path text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (post_id, sort_order)
);

create index bongstagram_post_media_post_order_idx on bongstagram_post_media(post_id, sort_order);

alter table bongstagram_posts enable row level security;
alter table bongstagram_post_media enable row level security;
create policy "public read Bongstagram posts" on bongstagram_posts for select using (
  exists (
    select 1 from bongstagram_profiles
    where bongstagram_profiles.character_id = bongstagram_posts.character_id
  )
);
create policy "public read Bongstagram post media" on bongstagram_post_media for select using (
  exists (
    select 1 from bongstagram_posts
    join bongstagram_profiles on bongstagram_profiles.character_id = bongstagram_posts.character_id
    where bongstagram_posts.id = bongstagram_post_media.post_id
  )
);

-- bongstagram_post_likes
-- 원본 IP는 저장하지 않고 서버에서 해시한 값만 보관한다.
create table bongstagram_post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references bongstagram_posts(id) on delete cascade,
  ip_hash    text not null check (char_length(ip_hash) = 64),
  created_at timestamptz not null default now(),
  unique (post_id, ip_hash)
);

create index bongstagram_post_likes_post_idx on bongstagram_post_likes(post_id);

-- bongstagram_story_likes
-- 원본 IP는 저장하지 않고 서버에서 해시한 값만 보관한다.
create table bongstagram_story_likes (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references bongstagram_posts(id) on delete cascade,
  ip_hash    text not null check (char_length(ip_hash) = 64),
  created_at timestamptz not null default now(),
  unique (story_id, ip_hash)
);

create index bongstagram_story_likes_story_idx on bongstagram_story_likes(story_id);

-- bongstagram_like_rate_limits
-- 같은 IP 해시의 좋아요 요청을 서버에서 짧은 간격으로 반복하지 못하도록 제한한다.
create table bongstagram_like_rate_limits (
  ip_hash          text primary key check (char_length(ip_hash) = 64),
  last_request_at  timestamptz not null default now()
);

alter table bongstagram_like_rate_limits enable row level security;

create or replace function check_bongstagram_like_rate_limit(
  p_ip_hash text,
  p_window_ms integer default 1000
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
  if p_window_ms < 100 then
    raise exception 'invalid rate limit window';
  end if;

  insert into bongstagram_like_rate_limits (ip_hash, last_request_at)
  values (p_ip_hash, now())
  on conflict (ip_hash) do update
    set last_request_at = excluded.last_request_at
    where bongstagram_like_rate_limits.last_request_at
      <= now() - (p_window_ms * interval '1 millisecond')
  returning true into accepted;

  return coalesce(accepted, false);
end;
$$;

revoke all on table bongstagram_like_rate_limits from public, anon, authenticated;
revoke all on function check_bongstagram_like_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function check_bongstagram_like_rate_limit(text, integer) to service_role;

-- report_rate_limits
-- 공개 제보의 반복 제출을 서버에서 제한한다.
create table report_rate_limits (
  ip_hash          text primary key check (char_length(ip_hash) = 64),
  last_request_at  timestamptz not null default now()
);

alter table report_rate_limits enable row level security;

create or replace function check_report_rate_limit(
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

  insert into report_rate_limits (ip_hash, last_request_at)
  values (p_ip_hash, now())
  on conflict (ip_hash) do update
    set last_request_at = excluded.last_request_at
    where report_rate_limits.last_request_at
      <= now() - (p_window_ms * interval '1 millisecond')
  returning true into accepted;

  return coalesce(accepted, false);
end;
$$;

revoke all on table report_rate_limits from public, anon, authenticated;
revoke all on function check_report_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function check_report_rate_limit(text, integer) to service_role;

-- bongstagram_post_comments
-- 공개 사용자는 조회만 가능하며 등록은 서비스 롤 관리자 작업으로 제한한다.
create table bongstagram_post_comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references bongstagram_posts(id) on delete cascade,
  parent_comment_id uuid references bongstagram_post_comments(id) on delete cascade,
  author_character_id uuid references characters(id) on delete set null,
  author_name       text not null check (char_length(btrim(author_name)) between 1 and 40),
  content           text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at        timestamptz not null default now()
);

create index bongstagram_post_comments_post_created_idx
  on bongstagram_post_comments(post_id, created_at asc);
create index bongstagram_post_comments_parent_idx
  on bongstagram_post_comments(parent_comment_id, created_at asc);
create index bongstagram_post_comments_author_character_idx
  on bongstagram_post_comments(author_character_id);

alter table bongstagram_post_likes enable row level security;
alter table bongstagram_story_likes enable row level security;
alter table bongstagram_post_comments enable row level security;
create policy "public read Bongstagram post comments" on bongstagram_post_comments for select using (
  exists (
    select 1 from bongstagram_posts
    join bongstagram_profiles on bongstagram_profiles.character_id = bongstagram_posts.character_id
    where bongstagram_posts.id = bongstagram_post_comments.post_id
  )
);

-- bbs_articles
-- 담당기자는 characters.id로 연결해 현재 캐릭터명을 기사에 표시한다.
create table bbs_articles (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  category              text not null default 'other',
  summary               text,
  content               text not null default '',
  thumbnail_url         text,
  approved_at           timestamptz,
  is_published          boolean not null default false,
  reporter_character_id uuid not null references characters(id) on delete restrict,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint bbs_articles_title_length
    check (char_length(btrim(title)) between 1 and 200),
  constraint bbs_articles_category
    check (category in ('info', 'incident', 'economy', 'column', 'other')),
  constraint bbs_articles_summary_length
    check (summary is null or char_length(summary) <= 500),
  constraint bbs_articles_content_length
    check (char_length(content) <= 50000),
  constraint bbs_articles_thumbnail_url_format
    check (thumbnail_url is null or thumbnail_url ~* '^https?://'),
  constraint bbs_articles_published_requires_approval
    check (not is_published or approved_at is not null)
);

create index bbs_articles_approved_at_idx
  on bbs_articles(is_published, approved_at desc, id desc);
create index bbs_articles_category_approved_at_idx
  on bbs_articles(category, is_published, approved_at desc, id desc);
create index bbs_articles_reporter_character_idx
  on bbs_articles(reporter_character_id);

create trigger bbs_articles_updated_at before update on bbs_articles
  for each row execute function update_updated_at();

alter table bbs_articles enable row level security;
create policy "public read published BBS articles" on bbs_articles for select using (
  is_published = true
);

-- bbs_article_media
-- 기사당 최대 5장(순서 0~4)의 첨부 이미지를 저장한다.
create table bbs_article_media (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references bbs_articles(id) on delete cascade,
  image_url  text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint bbs_article_media_image_url_format
    check (image_url ~* '^https?://'),
  constraint bbs_article_media_sort_order
    check (sort_order between 0 and 4),
  unique (article_id, sort_order)
);

create index bbs_article_media_article_order_idx
  on bbs_article_media(article_id, sort_order);

alter table bbs_article_media enable row level security;
create policy "public read published BBS article media" on bbs_article_media for select using (
  exists (
    select 1 from bbs_articles
    where bbs_articles.id = bbs_article_media.article_id
      and bbs_articles.is_published = true
  )
);

-- bbs_article_reactions
-- 좋아요와 싫어요는 원본 IP를 저장하지 않고 서버 해시 기준으로 한 기사당 1회 처리한다.
create table bbs_article_reactions (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references bbs_articles(id) on delete cascade,
  ip_hash    text not null,
  reaction   text not null,
  created_at timestamptz not null default now(),
  constraint bbs_article_reactions_ip_hash_length
    check (char_length(ip_hash) = 64),
  constraint bbs_article_reactions_type
    check (reaction in ('like', 'dislike')),
  unique (article_id, ip_hash)
);

create index bbs_article_reactions_article_type_idx
  on bbs_article_reactions(article_id, reaction);

alter table bbs_article_reactions enable row level security;

-- bbs_article_comments
-- 공개 사용자는 조회만 가능하며 등록은 서비스 롤 관리자 작업으로 제한한다.
create table bbs_article_comments (
  id                  uuid primary key default gen_random_uuid(),
  article_id          uuid not null references bbs_articles(id) on delete cascade,
  author_character_id uuid references characters(id) on delete set null,
  author_name         text not null,
  content             text not null,
  created_at          timestamptz not null default now(),
  constraint bbs_article_comments_author_name_length
    check (char_length(btrim(author_name)) between 1 and 40),
  constraint bbs_article_comments_content_length
    check (char_length(btrim(content)) between 1 and 1000)
);

create index bbs_article_comments_article_created_idx
  on bbs_article_comments(article_id, created_at asc);
create index bbs_article_comments_author_character_idx
  on bbs_article_comments(author_character_id);

alter table bbs_article_comments enable row level security;
create policy "public read published BBS article comments" on bbs_article_comments for select using (
  exists (
    select 1 from bbs_articles
    where bbs_articles.id = bbs_article_comments.article_id
      and bbs_articles.is_published = true
  )
);
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
