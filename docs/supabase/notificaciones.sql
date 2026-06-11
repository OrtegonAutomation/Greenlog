-- ============================================================
-- GreenLog — Tabla de notificaciones in-app
-- Ejecutar en el proyecto Supabase de GreenLog.
-- Respalda la campana de notificaciones del header.
-- ============================================================

create table if not exists public.greenlog_notificaciones (
  id                uuid primary key default gen_random_uuid(),
  destinatario_email text not null,
  tipo              text not null,            -- 'revision_solicitada' | 'revision_aprobada' | 'revision_rechazada'
  titulo            text,
  mensaje           text,
  actividad_id      uuid,                     -- FK lógica a greenlog_actividades.id (sin constraint dura)
  actividad_tarea   text,
  linea_operativa   text,
  zona              text,
  actor_nombre      text,                     -- quién originó el evento
  leida             boolean not null default false,
  creado_en         timestamptz not null default now()
);

create index if not exists idx_greenlog_notif_destinatario
  on public.greenlog_notificaciones (destinatario_email, leida, creado_en desc);

-- ── Row Level Security ──────────────────────────────────────
alter table public.greenlog_notificaciones enable row level security;

-- El destinatario puede leer sus propias notificaciones.
drop policy if exists "notif_select_propias" on public.greenlog_notificaciones;
create policy "notif_select_propias"
  on public.greenlog_notificaciones
  for select
  using (destinatario_email = (auth.jwt() ->> 'email'));

-- El destinatario puede marcarlas como leídas (update sobre las suyas).
drop policy if exists "notif_update_propias" on public.greenlog_notificaciones;
create policy "notif_update_propias"
  on public.greenlog_notificaciones
  for update
  using (destinatario_email = (auth.jwt() ->> 'email'))
  with check (destinatario_email = (auth.jwt() ->> 'email'));

-- Cualquier usuario autenticado puede crear notificaciones (un planeador
-- notifica a los revisores; un revisor notifica al solicitante).
drop policy if exists "notif_insert_autenticados" on public.greenlog_notificaciones;
create policy "notif_insert_autenticados"
  on public.greenlog_notificaciones
  for insert
  to authenticated
  with check (true);
