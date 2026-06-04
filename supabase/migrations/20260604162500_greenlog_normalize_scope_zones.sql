-- Normalize zone matching for RLS scopes, so values like "Coveñas" and
-- "Covenas" match consistently.

create or replace function public.greenlog_norm_scope_value(p_value text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(
      lower(coalesce(p_value, '')),
      U&'\00E1\00E9\00ED\00F3\00FA\00FC\00F1',
      'aeiouun'
    ),
    '[^a-z0-9]+',
    ' ',
    'g'
  );
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
          or public.greenlog_norm_scope_value(a.zona) = public.greenlog_norm_scope_value(coalesce(p_zona, ''))
        )
    );
$$;
