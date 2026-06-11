-- ============================================================
-- GreenLog — Acceso de administradores a TODAS las notificaciones
-- Ejecutar DESPUÉS de notificaciones.sql.
-- Permite que los correos administradores lean todas las notificaciones
-- (supervisión / desarrollo), no solo las propias.
-- ============================================================

-- Política de lectura para administradores: ven todo.
drop policy if exists "notif_select_admin" on public.greenlog_notificaciones;
create policy "notif_select_admin"
  on public.greenlog_notificaciones
  for select
  using (
    lower(auth.jwt() ->> 'email') in (
      'camilo.ortegonc@outlook.com',
      'juan.cardenaso@cenit-transporte.com',
      'jefatura-ambiental@cenit-transporte.com'
    )
  );

-- Nota: las políticas SELECT son OR-inclusivas. Con esta política, un admin
-- ve TODAS las filas; los demás siguen viendo solo las suyas por
-- "notif_select_propias". Para actualizar (marcar leídas) cualquiera, se
-- añade también update para admin:
drop policy if exists "notif_update_admin" on public.greenlog_notificaciones;
create policy "notif_update_admin"
  on public.greenlog_notificaciones
  for update
  using (
    lower(auth.jwt() ->> 'email') in (
      'camilo.ortegonc@outlook.com',
      'juan.cardenaso@cenit-transporte.com',
      'jefatura-ambiental@cenit-transporte.com'
    )
  )
  with check (true);
