-- ============================================================
-- Snapshots anuales de planeación ("Bloquear año").
-- Congela el agregado Zona × Línea de lo planeado tipo "Plan" de un año,
-- para usarlo como base de comparación en Reportes (igual que la matriz
-- estática 2026 de src/data/baseline2026.ts, pero por año y en BD).
-- celdas: [{ "zona": "CLC", "linea": "Monitoreos", "valor": 123 }, ...]
-- Aplicado en producción: 2026-07-20.
-- ============================================================

create table if not exists public.greenlog_snapshot_anual (
  anio integer primary key,
  celdas jsonb not null,
  total numeric not null,
  n_actividades integer not null default 0,
  creado_por text,
  creado_en timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────
alter table public.greenlog_snapshot_anual enable row level security;

-- Cualquier usuario autenticado puede leer los snapshots (Reportes).
drop policy if exists "snapshot_anual_select" on public.greenlog_snapshot_anual;
create policy "snapshot_anual_select"
  on public.greenlog_snapshot_anual
  for select
  to authenticated
  using (true);

-- Solo admins pueden congelar/reemplazar/eliminar (misma regla que greenlog_config).
drop policy if exists "snapshot_anual_admin_write" on public.greenlog_snapshot_anual;
create policy "snapshot_anual_admin_write"
  on public.greenlog_snapshot_anual
  for all
  to authenticated
  using (public.greenlog_is_admin())
  with check (public.greenlog_is_admin());
