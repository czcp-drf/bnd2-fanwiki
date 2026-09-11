begin;
create or replace function public.save_character(
  p_character_id uuid, p_name text, p_job text, p_status text, p_org_id uuid, p_role text
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_name is null or btrim(p_name) = '' or p_status is null or p_status not in ('active', 'dead', 'retired', 'hiatus') then
    raise exception 'Invalid character input' using errcode = '22023';
  end if;
  -- Lock the character so concurrent edits cannot interleave membership changes.
  perform 1 from public.characters where id = p_character_id for update;
  if not found then
    raise exception 'Character not found' using errcode = 'P0002';
  end if;
  update public.characters set name = btrim(p_name), job = nullif(btrim(p_job), ''), status = p_status where id = p_character_id;
  if p_org_id is not null then
    insert into public.organization_members (character_id, organization_id, role, is_primary, left_at)
    values (p_character_id, p_org_id, nullif(btrim(p_role), ''), true, null)
    on conflict (character_id, organization_id) do update
    set role = excluded.role, is_primary = true, left_at = null;
  end if;
  delete from public.organization_members
  where character_id = p_character_id and is_primary = true
    and (p_org_id is null or organization_id <> p_org_id);
end;
$$;
revoke all on function public.save_character(uuid,text,text,text,uuid,text) from public, anon, authenticated;
grant execute on function public.save_character(uuid,text,text,text,uuid,text) to service_role;
commit;
