-- Catalogo global editable de items y tarifas para GreenLog.
-- Las actividades guardan copia historica en opex_data_raw; este catalogo solo afecta nuevas planeaciones.

create table if not exists public.greenlog_catalogo_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  linea_operativa text not null,
  item text not null,
  descripcion text not null default '',
  unidad text not null default 'Global',
  precio_referencia numeric not null default 0,
  precios_mensuales jsonb,
  zona_scope text not null default '*',
  estacion text,
  metadata jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  creado_por_email text,
  actualizado_por_email text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint greenlog_catalogo_items_unique unique (linea_operativa, item_key, zona_scope)
);

create index if not exists greenlog_catalogo_items_lookup_idx
on public.greenlog_catalogo_items (linea_operativa, zona_scope, activo);

drop trigger if exists greenlog_catalogo_items_touch_updated_at on public.greenlog_catalogo_items;
create trigger greenlog_catalogo_items_touch_updated_at
before update on public.greenlog_catalogo_items
for each row execute function public.greenlog_touch_updated_at();

alter table public.greenlog_catalogo_items enable row level security;

drop policy if exists greenlog_catalogo_items_select_scope on public.greenlog_catalogo_items;
create policy greenlog_catalogo_items_select_scope
on public.greenlog_catalogo_items
for select
to anon, authenticated
using (
  activo = true
  and public.greenlog_can_view(linea_operativa, nullif(zona_scope, '*'))
);

drop policy if exists greenlog_catalogo_items_insert_planeador on public.greenlog_catalogo_items;
create policy greenlog_catalogo_items_insert_planeador
on public.greenlog_catalogo_items
for insert
to anon, authenticated
with check (
  public.greenlog_has_scope('planeador', linea_operativa, nullif(zona_scope, '*'))
);

drop policy if exists greenlog_catalogo_items_update_planeador on public.greenlog_catalogo_items;
create policy greenlog_catalogo_items_update_planeador
on public.greenlog_catalogo_items
for update
to anon, authenticated
using (
  public.greenlog_has_scope('planeador', linea_operativa, nullif(zona_scope, '*'))
)
with check (
  public.greenlog_has_scope('planeador', linea_operativa, nullif(zona_scope, '*'))
);
