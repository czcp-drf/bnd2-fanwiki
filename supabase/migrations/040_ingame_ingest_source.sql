-- 인게임 데이터 수집 대비: 출처 구분과 중복 방지 컬럼 추가
-- source: 'manual'(관리자 직접 등록) | 'ingame'(인게임에서 수집)
-- external_id: 인게임 원본 ID — upsert 시 중복 삽입 방지에 사용
--
-- 기존 행은 모두 source = 'manual', external_id = NULL 로 유지됩니다.
-- 인게임 수집 경로가 확정되기 전까지 실제 데이터 변경 없이 스키마만 준비합니다.

begin;

-- ─── bongstagram_posts ───────────────────────────────────────────────────────

alter table public.bongstagram_posts
  add column source      text not null default 'manual',
  add column external_id text;

alter table public.bongstagram_posts
  add constraint bongstagram_posts_source
    check (source in ('manual', 'ingame')),
  add constraint bongstagram_posts_external_id_unique
    unique (external_id);  -- NULL은 UNIQUE 제약에서 중복으로 처리되지 않음

create index bongstagram_posts_source_idx
  on public.bongstagram_posts(source);

comment on column public.bongstagram_posts.source is
  'Data origin: manual (admin-entered) or ingame (extracted from FiveM phone app)';
comment on column public.bongstagram_posts.external_id is
  'Original ID from the ingame SNS system; prevents duplicate ingestion on upsert';

-- ─── bbs_articles ────────────────────────────────────────────────────────────

alter table public.bbs_articles
  add column source      text not null default 'manual',
  add column external_id text;

alter table public.bbs_articles
  add constraint bbs_articles_source
    check (source in ('manual', 'ingame')),
  add constraint bbs_articles_external_id_unique
    unique (external_id);

create index bbs_articles_source_idx
  on public.bbs_articles(source);

comment on column public.bbs_articles.source is
  'Data origin: manual (admin-entered) or ingame (extracted from FiveM BBS app)';
comment on column public.bbs_articles.external_id is
  'Original ID from the ingame BBS system; prevents duplicate ingestion on upsert';

-- ─────────────────────────────────────────────────────────────────────────────

notify pgrst, 'reload schema';
commit;
