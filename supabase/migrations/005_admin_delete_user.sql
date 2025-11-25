-- Admin delete user helper
create or replace function delete_user_completely(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not is_admin() then
    raise exception 'Vous devez être admin pour supprimer un utilisateur' using errcode = '42501';
  end if;

  -- Remove related records in public schema (handled by cascades)
  delete from users where id = p_user_id;

  -- Remove auth user (cascades back to public.users as well)
  delete from auth.users where id = p_user_id;
end;
$$;

grant execute on function delete_user_completely(uuid) to authenticated;

