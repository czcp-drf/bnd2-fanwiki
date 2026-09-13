-- Bongstagram 스토리 좋아요
-- 원본 IP는 저장하지 않고 서버에서 해시한 값으로 스토리별 1회만 허용한다.
begin;

create table if not exists public.bongstagram_story_likes (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.bongstagram_posts(id) on delete cascade,
  ip_hash    text not null,
  created_at timestamptz not null default now(),
  constraint bongstagram_story_likes_ip_hash_length check (char_length(ip_hash) = 64),
  constraint bongstagram_story_likes_story_ip_unique unique (story_id, ip_hash)
);

create index if not exists bongstagram_story_likes_story_idx
  on public.bongstagram_story_likes(story_id);

alter table public.bongstagram_story_likes enable row level security;

comment on table public.bongstagram_story_likes is 'Bongstagram story likes; one hashed IP per story';
comment on column public.bongstagram_story_likes.ip_hash is 'SHA-256 hash of the client IP; raw IP is never stored';

notify pgrst, 'reload schema';
commit;
