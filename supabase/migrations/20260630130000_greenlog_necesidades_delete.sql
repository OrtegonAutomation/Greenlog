-- Permite eliminar necesidades/subnecesidades del catalogo solo a administradores.

drop policy if exists greenlog_necesidades_delete on public.greenlog_necesidades;
create policy greenlog_necesidades_delete
on public.greenlog_necesidades
for delete
to anon, authenticated
using (public.greenlog_is_admin());
