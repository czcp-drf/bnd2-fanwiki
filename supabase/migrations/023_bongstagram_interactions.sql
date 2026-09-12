-- Bongstagram 좋아요·댓글
-- 좋아요는 서버에서 IP를 해시한 값으로 게시물별 1회만 허용한다.
begin;

create table if not exists public.bongstagram_post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.bongstagram_posts(id) on delete cascade,
  ip_hash    text not null,
  created_at timestamptz not null default now(),
  constraint bongstagram_post_likes_ip_hash_length check (char_length(ip_hash) = 64),
  constraint bongstagram_post_likes_post_ip_unique unique (post_id, ip_hash)
);

create index if not exists bongstagram_post_likes_post_idx
  on public.bongstagram_post_likes(post_id);

create table if not exists public.bongstagram_post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.bongstagram_posts(id) on delete cascade,
  author_name text not null,
  content     text not null,
  created_at  timestamptz not null default now(),
  constraint bongstagram_post_comments_author_length
    check (char_length(btrim(author_name)) between 1 and 40),
  constraint bongstagram_post_comments_content_length
    check (char_length(btrim(content)) between 1 and 1000)
);

create index if not exists bongstagram_post_comments_post_created_idx
  on public.bongstagram_post_comments(post_id, created_at asc);

alter table public.bongstagram_post_likes enable row level security;
alter table public.bongstagram_post_comments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'bongstagram_post_comments'
      and policyname = 'public read Bongstagram post comments'
  ) then
    create policy "public read Bongstagram post comments"
      on public.bongstagram_post_comments for select using (
        exists (
          select 1
          from public.bongstagram_posts
          join public.bongstagram_profiles
            on bongstagram_profiles.character_id = bongstagram_posts.character_id
          where bongstagram_posts.id = bongstagram_post_comments.post_id
        )
      );
  end if;
end;
$$;

comment on table public.bongstagram_post_likes is 'Bongstagram post likes; one hashed IP per post';
comment on column public.bongstagram_post_likes.ip_hash is 'SHA-256 hash of the client IP; raw IP is never stored';
comment on table public.bongstagram_post_comments is 'Bongstagram post comments; managed by administrators';

notify pgrst, 'reload schema';
commit;
