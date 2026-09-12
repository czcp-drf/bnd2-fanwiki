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
  color       text,
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
  reference_url text,
  status        text default 'pending'
                check (status in ('pending', 'reviewing', 'applied', 'rejected')),
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
alter table event_clips enable row level security;
alter table reports enable row level security;

-- 공개 읽기 정책
create policy "public read streamers" on streamers for select using (true);
create policy "public read characters" on characters for select using (true);
create policy "public read organizations" on organizations for select using (true);
create policy "public read organization_members" on organization_members for select using (true);
create policy "public read character_relationships" on character_relationships for select using (true);
create policy "public read events" on events for select using (is_published = true);
create policy "public read event_participants" on event_participants for select using (true);
create policy "public read event_clips" on event_clips for select using (true);

-- 제보는 누구나 insert 가능
create policy "public insert reports" on reports for insert with check (true);

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
