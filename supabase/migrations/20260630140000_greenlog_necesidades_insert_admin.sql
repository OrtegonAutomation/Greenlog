-- Restringe la creacion de necesidades/subnecesidades a solo administradores
-- (antes la permitia cualquier planeador). Lectura sigue abierta a autenticados;
-- eliminacion ya es admin-only.

drop policy if exists greenlog_necesidades_insert on public.greenlog_necesidades;
create policy greenlog_necesidades_insert
on public.greenlog_necesidades
for insert
to anon, authenticated
with check (public.greenlog_is_admin());
