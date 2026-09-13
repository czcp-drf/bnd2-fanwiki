-- BSS 기사 좋아요·싫어요·댓글
-- 좋아요와 싫어요는 원본 IP를 저장하지 않고 서버 해시 기준으로 한 기사당 1회 처리한다.
begin;

create table public.bss_article_reactions (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.bss_articles(id) on delete cascade,
  ip_hash    text not null,
  reaction   text not null,
  created_at timestamptz not null default now(),
  constraint bss_article_reactions_ip_hash_length
    check (char_length(ip_hash) = 64),
  constraint bss_article_reactions_type
    check (reaction in ('like', 'dislike')),
  unique (article_id, ip_hash)
);

create index bss_article_reactions_article_type_idx
  on public.bss_article_reactions(article_id, reaction);

create table public.bss_article_comments (
  id                   uuid primary key default gen_random_uuid(),
  article_id           uuid not null references public.bss_articles(id) on delete cascade,
  author_character_id  uuid references public.characters(id) on delete set null,
  author_name          text not null,
  content              text not null,
  created_at           timestamptz not null default now(),
  constraint bss_article_comments_author_name_length
    check (char_length(btrim(author_name)) between 1 and 40),
  constraint bss_article_comments_content_length
    check (char_length(btrim(content)) between 1 and 1000)
);

create index bss_article_comments_article_created_idx
  on public.bss_article_comments(article_id, created_at asc);
create index bss_article_comments_author_character_idx
  on public.bss_article_comments(author_character_id);

alter table public.bss_article_reactions enable row level security;
alter table public.bss_article_comments enable row level security;

create policy "public read published BSS article comments"
  on public.bss_article_comments for select using (
    exists (
      select 1
      from public.bss_articles
      where bss_articles.id = bss_article_comments.article_id
        and bss_articles.is_published = true
    )
  );

revoke all on table public.bss_article_reactions from public, anon, authenticated;

comment on table public.bss_article_reactions is 'BSS article reactions; one hashed-IP reaction per article';
comment on column public.bss_article_reactions.ip_hash is 'SHA-256 hash of the client IP; raw IP is never stored';
comment on table public.bss_article_comments is 'Administrator-managed BSS article comments';
comment on column public.bss_article_comments.author_character_id is 'Character whose current name is displayed as the comment author';

notify pgrst, 'reload schema';
commit;
