-- Temporary pilot access for GitHub Pages without corporate Entra ID.
-- The frontend sends x-greenlog-email after validating the static allowlist.
-- This must be replaced by Supabase Auth / Entra ID for production.

create or replace function public.greenlog_current_email()
returns text
language sql
stable
as $$
  select lower(trim(coalesce(
    nullif(auth.jwt()->>'email', ''),
    nullif(current_setting('request.headers', true)::json->>'x-greenlog-email', ''),
    ''
  )));
$$;

drop policy if exists greenlog_usuarios_select_self_or_admin on public.greenlog_usuarios;
create policy greenlog_usuarios_select_self_or_admin
on public.greenlog_usuarios
for select
to anon, authenticated
using (email = public.greenlog_current_email() or public.greenlog_is_admin());

drop policy if exists greenlog_usuarios_admin_all on public.greenlog_usuarios;
create policy greenlog_usuarios_admin_all
on public.greenlog_usuarios
for all
to anon, authenticated
using (public.greenlog_is_admin())
with check (public.greenlog_is_admin());

drop policy if exists greenlog_usuario_ambitos_select_self_or_admin on public.greenlog_usuario_ambitos;
create policy greenlog_usuario_ambitos_select_self_or_admin
on public.greenlog_usuario_ambitos
for select
to anon, authenticated
using (
  public.greenlog_is_admin()
  or exists (
    select 1
    from public.greenlog_usuarios u
    where u.id = usuario_id
      and u.email = public.greenlog_current_email()
      and u.activo = true
  )
);

drop policy if exists greenlog_usuario_ambitos_admin_all on public.greenlog_usuario_ambitos;
create policy greenlog_usuario_ambitos_admin_all
on public.greenlog_usuario_ambitos
for all
to anon, authenticated
using (public.greenlog_is_admin())
with check (public.greenlog_is_admin());

drop policy if exists greenlog_actividades_select_scope on public.greenlog_actividades;
create policy greenlog_actividades_select_scope
on public.greenlog_actividades
for select
to anon, authenticated
using (public.greenlog_can_view(linea_operativa, zona));

drop policy if exists greenlog_actividades_insert_planeador on public.greenlog_actividades;
create policy greenlog_actividades_insert_planeador
on public.greenlog_actividades
for insert
to anon, authenticated
with check (public.greenlog_has_scope('planeador', linea_operativa, zona));

drop policy if exists greenlog_actividades_update_scope on public.greenlog_actividades;
create policy greenlog_actividades_update_scope
on public.greenlog_actividades
for update
to anon, authenticated
using (
  public.greenlog_is_admin()
  or public.greenlog_has_scope('planeador', linea_operativa, zona)
  or public.greenlog_has_scope('revisor', linea_operativa, zona)
)
with check (
  public.greenlog_is_admin()
  or public.greenlog_has_scope('planeador', linea_operativa, zona)
  or public.greenlog_has_scope('revisor', linea_operativa, zona)
);

drop policy if exists greenlog_actividades_delete_admin on public.greenlog_actividades;
create policy greenlog_actividades_delete_admin
on public.greenlog_actividades
for delete
to anon, authenticated
using (public.greenlog_is_admin());
