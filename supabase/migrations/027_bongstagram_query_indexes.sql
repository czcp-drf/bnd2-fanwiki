-- Bongstagram 공개 피드·스토리 조회 최적화
begin;

create index if not exists bongstagram_posts_type_posted_at_idx
  on public.bongstagram_posts(post_type, posted_at desc, id desc);

create index if not exists bongstagram_posts_active_story_expires_idx
  on public.bongstagram_posts(story_expires_at)
  where post_type = 'story';

commit;
