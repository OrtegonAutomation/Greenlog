-- ============================================================
-- RPC greenlog_allowlist_ambitos: devuelve los ámbitos (rol,
-- línea, zona) de un correo para que el frontend construya los
-- permisos de usuarios creados desde el módulo de Administración
-- (que no existen en la lista embebida del código).
-- Solo usuarios autenticados pueden consultarla.
-- ============================================================

create or replace function public.greenlog_allowlist_ambitos(p_email text)
returns table (tipo text, linea_operativa text, zona text, global boolean)
language sql
stable
security definer
set search_path = public
as $$
  select a.tipo, a.linea_operativa, a.zona, a.global
  from public.greenlog_usuario_ambitos a
  join public.greenlog_usuarios u on u.id = a.usuario_id
  where lower(u.email) = lower(trim(p_email))
    and u.activo = true;
$$;

revoke all on function public.greenlog_allowlist_ambitos(text) from public, anon;
grant execute on function public.greenlog_allowlist_ambitos(text) to authenticated;
