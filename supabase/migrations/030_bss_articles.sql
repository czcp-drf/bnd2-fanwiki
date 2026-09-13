-- BSS 기사 기본 스키마
-- 담당기자는 characters.id로 연결해 현재 캐릭터명을 기사에 표시한다.
begin;

create table public.bss_articles (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  category              text not null default 'other',
  summary               text,
  content               text not null default '',
  thumbnail_url         text,
  published_at          timestamptz not null default now(),
  is_published          boolean not null default false,
  reporter_character_id uuid not null references public.characters(id) on delete restrict,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint bss_articles_title_length
    check (char_length(btrim(title)) between 1 and 200),
  constraint bss_articles_category
    check (category in ('info', 'incident', 'economy', 'column', 'other')),
  constraint bss_articles_summary_length
    check (summary is null or char_length(summary) <= 500),
  constraint bss_articles_content_length
    check (char_length(content) <= 50000),
  constraint bss_articles_thumbnail_url_format
    check (thumbnail_url is null or thumbnail_url ~* '^https?://')
);

create index bss_articles_published_at_idx
  on public.bss_articles(is_published, published_at desc, id desc);
create index bss_articles_category_published_at_idx
  on public.bss_articles(category, is_published, published_at desc, id desc);
create index bss_articles_reporter_character_idx
  on public.bss_articles(reporter_character_id);

create trigger bss_articles_updated_at
  before update on public.bss_articles
  for each row execute function public.update_updated_at();

alter table public.bss_articles enable row level security;

create policy "public read published BSS articles"
  on public.bss_articles for select using (is_published = true);

comment on table public.bss_articles is 'BSS in-game news articles; managed by administrators';
comment on column public.bss_articles.category is 'Stable category key: info, incident, economy, column, or other';
comment on column public.bss_articles.thumbnail_url is 'Representative article image URL';
comment on column public.bss_articles.published_at is 'Initial publication date; renamed to approved_at by migration 032';
comment on column public.bss_articles.reporter_character_id is 'Character whose current name is displayed as the reporter';

notify pgrst, 'reload schema';
commit;
