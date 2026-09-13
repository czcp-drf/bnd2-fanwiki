-- BSS 기사 승인일시 정리
-- 이미 적용된 030의 published_at을 공개 화면 기준인 approved_at으로 변경한다.
begin;

-- 030을 approved_at 기준으로 먼저 적용한 환경과
-- published_at 기준으로 적용한 환경을 모두 지원한다.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bss_articles'
      and column_name = 'published_at'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bss_articles'
      and column_name = 'approved_at'
  ) then
    alter table public.bss_articles
      rename column published_at to approved_at;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bss_articles'
      and column_name = 'published_at'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bss_articles'
      and column_name = 'approved_at'
  ) then
    update public.bss_articles
       set approved_at = coalesce(approved_at, published_at)
     where approved_at is null;
    alter table public.bss_articles
      drop column published_at;
  end if;
end;
$$;

alter table public.bss_articles
  alter column approved_at drop default,
  alter column approved_at drop not null;

do $$
begin
  if to_regclass('public.bss_articles_published_at_idx') is not null
     and to_regclass('public.bss_articles_approved_at_idx') is null then
    alter index public.bss_articles_published_at_idx
      rename to bss_articles_approved_at_idx;
  end if;

  if to_regclass('public.bss_articles_category_published_at_idx') is not null
     and to_regclass('public.bss_articles_category_approved_at_idx') is null then
    alter index public.bss_articles_category_published_at_idx
      rename to bss_articles_category_approved_at_idx;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bss_articles'::regclass
      and conname = 'bss_articles_published_requires_approval'
  ) then
    alter table public.bss_articles
      add constraint bss_articles_published_requires_approval
      check (not is_published or approved_at is not null);
  end if;
end;
$$;

comment on column public.bss_articles.approved_at is 'Displayed approval date in KST-aware timestamptz';

notify pgrst, 'reload schema';
commit;
