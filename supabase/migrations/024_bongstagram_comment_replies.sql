-- Bongstagram 댓글 답글과 관리자 작성 시간 수정
-- 답글은 최상위 댓글에만 연결하는 1단계 구조로 운영한다.
begin;

alter table public.bongstagram_post_comments
  add column if not exists parent_comment_id uuid
  references public.bongstagram_post_comments(id) on delete cascade;

create index if not exists bongstagram_post_comments_parent_idx
  on public.bongstagram_post_comments(parent_comment_id, created_at asc);

comment on column public.bongstagram_post_comments.parent_comment_id
  is 'Parent comment for a one-level Bongstagram reply';

notify pgrst, 'reload schema';
commit;
