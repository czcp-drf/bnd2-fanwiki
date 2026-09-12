-- Bongstagram 게시물 확장: 게시물/스토리 타입과 이미지·동영상 다중 미디어
-- post_type이 이미 존재하는 환경과 020의 단일 image_url 구조를 모두 처리한다.
begin;

alter table public.bongstagram_posts
  add column if not exists post_type text not null default 'post',
  add column if not exists story_expires_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bongstagram_posts_type'
      and conrelid = 'public.bongstagram_posts'::regclass
  ) then
    alter table public.bongstagram_posts
      add constraint bongstagram_posts_type
      check (post_type in ('post', 'story'));
  end if;
end;
$$;

create table if not exists public.bongstagram_post_media (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.bongstagram_posts(id) on delete cascade,
  media_type text not null,
  media_url  text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint bongstagram_post_media_type
    check (media_type in ('image', 'video')),
  constraint bongstagram_post_media_url_format
    check (media_url ~* '^https?://'),
  constraint bongstagram_post_media_sort_order
    check (sort_order >= 0),
  constraint bongstagram_post_media_post_order
    unique (post_id, sort_order)
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bongstagram_posts'
      and column_name = 'image_url'
  ) then
    execute $sql$
      insert into public.bongstagram_post_media (post_id, media_type, media_url, sort_order)
      select p.id, 'image', p.image_url, 0
      from public.bongstagram_posts p
      where p.image_url is not null
        and not exists (
          select 1
          from public.bongstagram_post_media m
          where m.post_id = p.id
        )
    $sql$;
    alter table public.bongstagram_posts drop column image_url;
  end if;
end;
$$;

create index if not exists bongstagram_post_media_post_order_idx
  on public.bongstagram_post_media(post_id, sort_order);

alter table public.bongstagram_post_media enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bongstagram_post_media'
      and policyname = 'public read Bongstagram post media'
  ) then
    create policy "public read Bongstagram post media"
      on public.bongstagram_post_media for select using (
        exists (
          select 1
          from public.bongstagram_posts
          join public.bongstagram_profiles
            on bongstagram_profiles.character_id = bongstagram_posts.character_id
          where bongstagram_posts.id = bongstagram_post_media.post_id
        )
      );
  end if;
end;
$$;

comment on column public.bongstagram_posts.post_type is 'post or story';
comment on column public.bongstagram_posts.story_expires_at is 'Scheduled story visibility end';
comment on table public.bongstagram_post_media is 'Bongstagram post media in display order';

notify pgrst, 'reload schema';
commit;
