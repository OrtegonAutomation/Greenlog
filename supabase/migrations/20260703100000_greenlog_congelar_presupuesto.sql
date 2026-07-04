-- ============================================================
-- Congelamiento del presupuesto: la matriz financiera ya fue
-- enviada, así que se bloquea la creación/edición/borrado de
-- planeaciones para el equipo (los admins conservan acceso de
-- emergencia).
--
-- Para descongelar sin nueva migración:
--   update greenlog_config set valor='false'
--   where clave='presupuesto_congelado';
-- ============================================================

create table if not exists public.greenlog_config (
  clave text primary key,
  valor text not null,
  actualizado_en timestamptz not null default now()
);

alter table public.greenlog_config enable row level security;

drop policy if exists greenlog_config_select on public.greenlog_config;
create policy greenlog_config_select
on public.greenlog_config
for select
to authenticated
using (true);

drop policy if exists greenlog_config_admin_write on public.greenlog_config;
create policy greenlog_config_admin_write
on public.greenlog_config
for all
to authenticated
using (public.greenlog_is_admin())
with check (public.greenlog_is_admin());

insert into public.greenlog_config (clave, valor)
values ('presupuesto_congelado', 'true')
on conflict (clave) do update set valor = excluded.valor, actualizado_en = now();

-- ¿Está congelado el presupuesto? (security definer para usarla en policies)
create or replace function public.greenlog_presupuesto_congelado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select valor = 'true' from public.greenlog_config where clave = 'presupuesto_congelado'),
    false
  );
$$;

-- INSERT: planeadores solo si NO está congelado; admin siempre.
drop policy if exists greenlog_actividades_insert_planeador on public.greenlog_actividades;
create policy greenlog_actividades_insert_planeador
on public.greenlog_actividades
for insert
to authenticated
with check (
  public.greenlog_is_admin()
  or (
    not public.greenlog_presupuesto_congelado()
    and public.greenlog_has_scope('planeador', linea_operativa, zona)
  )
);

-- UPDATE: idem (admin siempre; equipo solo si no está congelado).
drop policy if exists greenlog_actividades_update_scope on public.greenlog_actividades;
create policy greenlog_actividades_update_scope
on public.greenlog_actividades
for update
to authenticated
using (
  public.greenlog_is_admin()
  or (
    not public.greenlog_presupuesto_congelado()
    and (
      public.greenlog_has_scope('planeador', linea_operativa, zona)
      or public.greenlog_has_scope('revisor', linea_operativa, zona)
    )
  )
)
with check (
  public.greenlog_is_admin()
  or (
    not public.greenlog_presupuesto_congelado()
    and (
      public.greenlog_has_scope('planeador', linea_operativa, zona)
      or public.greenlog_has_scope('revisor', linea_operativa, zona)
    )
  )
);

-- DELETE ya era solo-admin (greenlog_actividades_delete_admin): no cambia.
