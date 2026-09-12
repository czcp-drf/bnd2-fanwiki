-- Bongstagram 직접 업로드용 Storage 버킷과 파일 경로
begin;

alter table public.bongstagram_post_media
  add column if not exists storage_path text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'bongstagram-media',
  'bongstagram-media',
  true,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on column public.bongstagram_post_media.storage_path is 'Supabase Storage object path for directly uploaded media';

notify pgrst, 'reload schema';
commit;
