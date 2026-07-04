-- ============================================================
-- Rol "visor" (solo consulta de Reportes) + allowlist desde BD.
--
-- 1. greenlog_usuarios.visor: usuarios que pueden LEER todas las
--    actividades (para el módulo de Reportes) sin poder planear,
--    editar ni aprobar nada.
-- 2. greenlog_can_view incluye a los visores (solo afecta SELECT;
--    las políticas de INSERT/UPDATE/DELETE no usan can_view).
-- 3. RPC greenlog_allowlist_profile: el login del frontend puede
--    validar un correo contra la BD (antes solo existía la lista
--    embebida en el código), devolviendo el perfil básico.
-- 4. Seed de los 6 usuarios de consulta de Reportes.
-- ============================================================

alter table public.greenlog_usuarios
  add column if not exists visor boolean not null default false;

-- SELECT de actividades: admins, planeadores/revisores del ámbito, o visores.
create or replace function public.greenlog_can_view(
  p_linea_operativa text,
  p_zona text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.greenlog_is_admin()
    or exists (
      select 1 from public.greenlog_usuarios u
      where u.email = public.greenlog_current_email()
        and u.activo = true
        and u.visor = true
    )
    or public.greenlog_has_scope('planeador', p_linea_operativa, p_zona)
    or public.greenlog_has_scope('revisor', p_linea_operativa, p_zona);
$$;

-- Perfil básico para la allowlist del login (accesible sin sesión).
create or replace function public.greenlog_allowlist_profile(p_email text)
returns table (nombre text, alcance text, zona_base text, admin boolean, visor boolean)
language sql
stable
security definer
set search_path = public
as $$
  select u.nombre, u.alcance, u.zona_base, u.admin, u.visor
  from public.greenlog_usuarios u
  where lower(u.email) = lower(trim(p_email))
    and u.activo = true;
$$;

grant execute on function public.greenlog_allowlist_profile(text) to anon, authenticated;

-- Seed: usuarios de consulta de Reportes (visor = true, sin ámbitos).
insert into public.greenlog_usuarios (email, nombre, alcance, base_trabajo, zona_base, admin, activo, visor)
values
  ('william.melo@cenit-transporte.com', 'William Javier Melo Traslavina', 'Consulta Reportes (CENIT)', 'Bogota', 'Transversal', false, true, true),
  ('isvelitza.coromoto@cenit-transporte.com', 'Isvelitza Coromoto Montilla Bastidas', 'Consulta Reportes (CENIT)', 'Bogota', 'Transversal', false, true, true),
  ('luz.guerrero.externo@cenit-transporte.com', 'Luz Adriana Guerrero Saray', 'Consulta Reportes (VQ)', 'Bogota', 'Transversal', false, true, true),
  ('andrea.orjuelag@cenit-transporte.com', 'Andrea del Pilar Orjuela Gutierrez', 'Consulta Reportes (CENIT)', 'Bogota', 'Transversal', false, true, true),
  ('yuritza.suarez.externo@cenit-transporte.com', 'Yuritza Alejandra Suarez Ramirez', 'Consulta Reportes (VQ)', 'Bogota', 'Transversal', false, true, true),
  ('ruddy.barragan.externo@cenit-transporte.com', 'Ruddy Milena Barragan Prieto', 'Consulta Reportes (Bureau Veritas)', 'Bogota', 'Transversal', false, true, true)
on conflict (email) do update set
  visor = true, activo = true, nombre = excluded.nombre, alcance = excluded.alcance;
