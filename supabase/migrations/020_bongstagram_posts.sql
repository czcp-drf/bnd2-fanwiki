-- Bongstagram 게시물: 기존 캐릭터의 프로필에 연결되는 피드 게시물
begin;

create table public.bongstagram_posts (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  image_url    text,
  content      text not null default '',
  posted_at    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint bongstagram_posts_content_length
    check (char_length(content) <= 2200),
  constraint bongstagram_posts_image_url_format
    check (image_url is null or image_url ~* '^https?://')
);

create index bongstagram_posts_character_posted_at_idx
  on public.bongstagram_posts(character_id, posted_at desc);
create index bongstagram_posts_posted_at_idx
  on public.bongstagram_posts(posted_at desc);

create trigger bongstagram_posts_updated_at
  before update on public.bongstagram_posts
  for each row execute function public.update_updated_at();

alter table public.bongstagram_posts enable row level security;

create policy "public read Bongstagram posts"
  on public.bongstagram_posts for select using (
    exists (
      select 1
      from public.bongstagram_profiles
      where bongstagram_profiles.character_id = bongstagram_posts.character_id
    )
  );

comment on table public.bongstagram_posts is 'Bongstagram feed posts; managed by administrators';
comment on column public.bongstagram_posts.posted_at is 'Displayed publication date of the post';

notify pgrst, 'reload schema';
commit;
