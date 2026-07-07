-- ============================================================
-- Zonas equivalentes en greenlog_has_scope.
--
-- El wizard de Compensaciones usa zonas propias ('Occidente Norte',
-- 'Occidente Sur', 'Caño Limón'...) mientras los ámbitos guardan la
-- zona operativa ('Occidente', 'CLC'...). El frontend ya las trata
-- como equivalentes (zonasMatch), pero la RLS comparaba texto exacto
-- y rechazaba con 403 los INSERT válidos (p. ej. Carmen creando
-- Compensaciones estaciones en 'Occidente Norte' con ámbito
-- 'Occidente').
--
-- Se replica la normalización del front:
--   'Occidente *'            → occidente
--   'Caño Limón*' / 'CLC'    → clc
--   'Coveñas'/'Covenas'      → covenas
--   'Norte-Coveñas'          → (se maneja por ámbitos separados)
-- ============================================================

create or replace function public.greenlog_zona_token(p_zona text)
returns text
language sql
immutable
as $$
  select case
    when n like 'occidente%' then 'occidente'
    when n = 'clc' or n like 'cano limon%' then 'clc'
    when n like 'covenas%' then 'covenas'
    else n
  end
  from (
    select btrim(regexp_replace(
      translate(lower(coalesce(p_zona, '')), 'áéíóúñü', 'aeiounu'),
      '[^a-z0-9]+', ' ', 'g'
    )) as n
  ) t;
$$;

create or replace function public.greenlog_has_scope(
  p_tipo text,
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
      select 1
      from public.greenlog_usuarios u
      join public.greenlog_usuario_ambitos a on a.usuario_id = u.id
      where u.email = public.greenlog_current_email()
        and u.activo = true
        and a.tipo = p_tipo
        and (a.linea_operativa = '*' or a.linea_operativa = p_linea_operativa)
        and (
          a.global = true
          or a.zona = '*'
          or public.greenlog_zona_token(a.zona) = public.greenlog_zona_token(p_zona)
        )
    );
$$;
