-- BBS 이미지의 원본 URL과 Supabase Storage URL을 함께 보관해 공개 서빙 경로를 전환할 수 있게 합니다.
begin;

create table if not exists public.bbs_article_media_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.bbs_articles(id) on delete cascade,
  source_url text not null,
  storage_url text not null,
  created_at timestamptz not null default now(),
  unique (article_id, source_url)
);

create index if not exists bbs_article_media_sources_article_id_idx
  on public.bbs_article_media_sources (article_id);

alter table public.bbs_article_media_sources enable row level security;

revoke all on table public.bbs_article_media_sources from public, anon, authenticated;
grant select on table public.bbs_article_media_sources to anon, authenticated;
grant all on table public.bbs_article_media_sources to service_role;

drop policy if exists "public read BBS article media sources" on public.bbs_article_media_sources;
create policy "public read BBS article media sources"
  on public.bbs_article_media_sources
  for select
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
commit;
