-- Catalogo persistente de tarifas de parametros de Monitoreos (CENIT 2026).
-- La tarifa se identifica por (categoria, parametro_norm) — categoria agua/suelo/general
-- derivada de la matriz. Las planeaciones guardan copia historica en opex_data_raw;
-- al cambiar una tarifa aqui, la app propaga el cambio a las planeaciones existentes.

create table if not exists public.greenlog_tarifas_parametros (
  categoria text not null,
  parametro_norm text not null,
  parametro text not null,
  precio numeric not null default 0,
  actualizado_por_email text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint greenlog_tarifas_parametros_pk primary key (categoria, parametro_norm)
);

drop trigger if exists greenlog_tarifas_parametros_touch_updated_at on public.greenlog_tarifas_parametros;
create trigger greenlog_tarifas_parametros_touch_updated_at
before update on public.greenlog_tarifas_parametros
for each row execute function public.greenlog_touch_updated_at();

alter table public.greenlog_tarifas_parametros enable row level security;

-- Lectura: cualquier usuario que pueda ver Monitoreos.
drop policy if exists greenlog_tarifas_parametros_select on public.greenlog_tarifas_parametros;
create policy greenlog_tarifas_parametros_select
on public.greenlog_tarifas_parametros
for select
to anon, authenticated
using (public.greenlog_can_view('Monitoreos', null));

-- Escritura (insert/update): planeadores de Monitoreos (incluye admin).
drop policy if exists greenlog_tarifas_parametros_insert on public.greenlog_tarifas_parametros;
create policy greenlog_tarifas_parametros_insert
on public.greenlog_tarifas_parametros
for insert
to anon, authenticated
with check (public.greenlog_has_scope('planeador', 'Monitoreos', null));

drop policy if exists greenlog_tarifas_parametros_update on public.greenlog_tarifas_parametros;
create policy greenlog_tarifas_parametros_update
on public.greenlog_tarifas_parametros
for update
to anon, authenticated
using (public.greenlog_has_scope('planeador', 'Monitoreos', null))
with check (public.greenlog_has_scope('planeador', 'Monitoreos', null));
