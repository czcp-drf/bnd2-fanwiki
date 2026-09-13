-- Bongstagram 댓글 작성자와 캐릭터 연결
begin;

alter table public.bongstagram_post_comments
  add column if not exists author_character_id uuid
  references public.characters(id) on delete set null;

update public.bongstagram_post_comments comment
set author_character_id = profile.character_id
from public.bongstagram_profiles profile
where comment.author_character_id is null
  and comment.author_name = profile.profile_name;

create index if not exists bongstagram_post_comments_author_character_idx
  on public.bongstagram_post_comments(author_character_id);

comment on column public.bongstagram_post_comments.author_character_id
  is 'Character identity of the Bongstagram comment author for red pill display';

notify pgrst, 'reload schema';
commit;
