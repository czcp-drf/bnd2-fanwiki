-- BSS에서 BBS로 변경된 기사 DB 식별자 반영
-- 기존 030~034 migration을 수정하지 않고 운영 DB의 테이블 이름만 변경한다.
-- Storage 스키마는 Supabase 보호 트리거가 직접 삭제를 막으므로,
-- 기존 bss-media가 비어 있는 경우에만 새 bbs-media 버킷을 만든다.
begin;

do $$
begin
  if to_regclass('public.bss_articles') is not null
    and to_regclass('public.bbs_articles') is not null then
    raise exception 'bss_articles와 bbs_articles가 동시에 존재해 rename을 중단했습니다.';
  end if;

  if to_regclass('public.bss_article_media') is not null
    and to_regclass('public.bbs_article_media') is not null then
    raise exception 'bss_article_media와 bbs_article_media가 동시에 존재해 rename을 중단했습니다.';
  end if;

  if to_regclass('public.bss_article_reactions') is not null
    and to_regclass('public.bbs_article_reactions') is not null then
    raise exception 'bss_article_reactions와 bbs_article_reactions가 동시에 존재해 rename을 중단했습니다.';
  end if;

  if to_regclass('public.bss_article_comments') is not null
    and to_regclass('public.bbs_article_comments') is not null then
    raise exception 'bss_article_comments와 bbs_article_comments가 동시에 존재해 rename을 중단했습니다.';
  end if;

  if to_regclass('public.bss_articles') is not null
    and to_regclass('public.bbs_articles') is null then
    alter table public.bss_articles rename to bbs_articles;
  end if;

  if to_regclass('public.bss_article_media') is not null
    and to_regclass('public.bbs_article_media') is null then
    alter table public.bss_article_media rename to bbs_article_media;
  end if;

  if to_regclass('public.bss_article_reactions') is not null
    and to_regclass('public.bbs_article_reactions') is null then
    alter table public.bss_article_reactions rename to bbs_article_reactions;
  end if;

  if to_regclass('public.bss_article_comments') is not null
    and to_regclass('public.bbs_article_comments') is null then
    alter table public.bss_article_comments rename to bbs_article_comments;
  end if;
end $$;

do $$
declare
  item record;
  new_name text;
begin
  -- Explicit and automatically generated indexes (including unique indexes)
  -- retain their old names when a table is renamed.
  for item in
    select schemaname, indexname
    from pg_indexes
    where schemaname = 'public'
      and tablename ~ '^bbs_'
      and indexname ~ '^bss_'
  loop
    new_name := regexp_replace(item.indexname, '^bss_', 'bbs_');
    if not exists (
      select 1
      from pg_class
      where relnamespace = 'public'::regnamespace
        and relname = new_name
    ) then
      execute format('alter index %I.%I rename to %I', item.schemaname, item.indexname, new_name);
    end if;
  end loop;
end $$;

do $$
declare
  item record;
  new_name text;
begin
  -- This also covers generated primary-key, foreign-key, and unique
  -- constraint names such as bss_article_media_article_id_fkey.
  for item in
    select
      c.conname,
      n.nspname as table_schema,
      cls.relname as table_name
    from pg_constraint c
    join pg_class cls on cls.oid = c.conrelid
    join pg_namespace n on n.oid = cls.relnamespace
    where n.nspname = 'public'
      and cls.relname ~ '^bbs_'
      and c.conname ~ '^bss_'
  loop
    new_name := regexp_replace(item.conname, '^bss_', 'bbs_');
    if not exists (
      select 1
      from pg_constraint existing
      join pg_class existing_table on existing_table.oid = existing.conrelid
      join pg_namespace existing_schema on existing_schema.oid = existing_table.relnamespace
      where existing_schema.nspname = item.table_schema
        and existing_table.relname = item.table_name
        and existing.conname = new_name
    ) then
      execute format(
        'alter table %I.%I rename constraint %I to %I',
        item.table_schema,
        item.table_name,
        item.conname,
        new_name
      );
    end if;
  end loop;

  if to_regclass('public.bbs_articles') is not null
    and exists (select 1 from pg_trigger where tgname = 'bss_articles_updated_at') then
    alter trigger bss_articles_updated_at on public.bbs_articles rename to bbs_articles_updated_at;
  end if;
end $$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'bbs-media',
  'bbs-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'bss-media') then
    raise exception 'bss-media에 파일이 있어 Storage rename을 중단했습니다. Storage API로 파일을 먼저 이동해 주세요.';
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
