-- BSS 기사 첨부 이미지
-- 기사당 최대 5장(순서 0~4)을 지원한다.
begin;

create table public.bss_article_media (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.bss_articles(id) on delete cascade,
  image_url  text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint bss_article_media_image_url_format
    check (image_url ~* '^https?://'),
  constraint bss_article_media_sort_order
    check (sort_order between 0 and 4),
  unique (article_id, sort_order)
);

create index bss_article_media_article_order_idx
  on public.bss_article_media(article_id, sort_order);

alter table public.bss_article_media enable row level security;

create policy "public read published BSS article media"
  on public.bss_article_media for select using (
    exists (
      select 1
      from public.bss_articles
      where bss_articles.id = bss_article_media.article_id
        and bss_articles.is_published = true
    )
  );

comment on table public.bss_article_media is 'BSS article images; at most five per article using sort_order 0 through 4';
comment on column public.bss_article_media.image_url is 'BSS article attached image URL';
comment on column public.bss_article_media.sort_order is 'Display order, limited to five positions (0-4)';

notify pgrst, 'reload schema';
commit;
