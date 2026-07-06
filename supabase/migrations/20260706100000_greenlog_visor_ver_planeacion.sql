-- ============================================================
-- Visores con acceso de solo-visualización a Planeación.
--
-- Columna ver_planeacion en greenlog_usuarios: los visores que la
-- tengan activa pueden abrir el módulo de Planeación en modo solo
-- lectura (sin crear/editar/eliminar, que ya bloquean las políticas
-- y la UI). Se habilita para Andrea Orjuela e Isvelitza Coromoto.
-- ============================================================

alter table public.greenlog_usuarios
  add column if not exists ver_planeacion boolean not null default false;

-- RPC de allowlist con el nuevo flag.
drop function if exists public.greenlog_allowlist_profile(text);
create or replace function public.greenlog_allowlist_profile(p_email text)
returns table (nombre text, alcance text, zona_base text, admin boolean, visor boolean, ver_planeacion boolean)
language sql
stable
security definer
set search_path = public
as $$
  select u.nombre, u.alcance, u.zona_base, u.admin, u.visor, u.ver_planeacion
  from public.greenlog_usuarios u
  where lower(u.email) = lower(trim(p_email))
    and u.activo = true;
$$;

grant execute on function public.greenlog_allowlist_profile(text) to anon, authenticated;

update public.greenlog_usuarios
set ver_planeacion = true
where email in (
  'andrea.orjuelag@cenit-transporte.com',
  'isvelitza.coromoto@cenit-transporte.com'
);
