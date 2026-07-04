-- ============================================================
-- Lectura global de actividades: todos los usuarios activos de la
-- allowlist (admins, planeadores, revisores/visores) pueden VER
-- todas las actividades — los Reportes deben ser completos, no
-- recortados por zona. La escritura sigue controlada por las
-- políticas de insert/update/delete (ámbitos + congelamiento).
-- ============================================================

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
  select exists (
    select 1 from public.greenlog_usuarios u
    where u.email = public.greenlog_current_email()
      and u.activo = true
  );
$$;
