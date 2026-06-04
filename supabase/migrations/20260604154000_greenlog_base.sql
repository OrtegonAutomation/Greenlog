-- GreenLog base schema for Supabase pilot.
-- This migration assumes Supabase Auth will provide auth.jwt()->>'email'.

create extension if not exists pgcrypto;

create table if not exists public.greenlog_usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nombre text not null default '',
  alcance text not null default '',
  base_trabajo text not null default '',
  zona_base text not null default '',
  admin boolean not null default false,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint greenlog_usuarios_email_lower_unique unique (email),
  constraint greenlog_usuarios_email_lowercase check (email = lower(email))
);

create table if not exists public.greenlog_usuario_ambitos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.greenlog_usuarios(id) on delete cascade,
  tipo text not null check (tipo in ('planeador', 'revisor')),
  linea_operativa text not null,
  zona text not null,
  global boolean not null default false,
  creado_en timestamptz not null default now(),
  constraint greenlog_usuario_ambitos_unique unique (usuario_id, tipo, linea_operativa, zona)
);

create table if not exists public.greenlog_actividades (
  id uuid primary key default gen_random_uuid(),
  tarea text not null,
  linea_operativa text not null,
  descripcion text,
  responsable text not null default '',
  contrato text,
  zona text not null default '',
  estacion text,
  tipo_lugar text,
  pk text,
  fuente_presupuesto text,
  tipo_planeacion text,
  anio_planeacion integer,
  fecha_inicio date,
  fecha_fin date,
  fecha_inicio_real date,
  fecha_fin_real date,
  mes text,
  estado text not null default 'Planeada',
  prioridad text not null default 'Media',
  cuenta text not null default 'OPEX',
  cumplimiento_normativo text,
  novedades text,
  porcentaje_avance numeric not null default 0,
  estado_aprobacion text not null default 'Pendiente',
  aprobado_por text,
  fecha_aprobacion timestamptz,
  solicitante_nombre text,
  solicitante_email text,
  presupuesto_plan numeric not null default 0,
  presupuesto_ejecutado numeric not null default 0,
  presupuesto_forecast numeric,
  matrices_aplicables jsonb not null default '[]'::jsonb,
  opex_data_raw jsonb,
  creado_por_email text,
  actualizado_por_email text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists greenlog_actividades_linea_zona_idx
  on public.greenlog_actividades (linea_operativa, zona);

create index if not exists greenlog_actividades_estado_aprobacion_idx
  on public.greenlog_actividades (estado_aprobacion);

create or replace function public.greenlog_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists greenlog_usuarios_touch_updated_at on public.greenlog_usuarios;
create trigger greenlog_usuarios_touch_updated_at
before update on public.greenlog_usuarios
for each row execute function public.greenlog_touch_updated_at();

drop trigger if exists greenlog_actividades_touch_updated_at on public.greenlog_actividades;
create trigger greenlog_actividades_touch_updated_at
before update on public.greenlog_actividades
for each row execute function public.greenlog_touch_updated_at();

create or replace function public.greenlog_current_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt()->>'email', ''));
$$;

create or replace function public.greenlog_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.greenlog_usuarios u
    where u.email = public.greenlog_current_email()
      and u.activo = true
      and u.admin = true
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
          or lower(a.zona) = lower(coalesce(p_zona, ''))
        )
    );
$$;

create or replace function public.greenlog_can_view(
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
    or public.greenlog_has_scope('planeador', p_linea_operativa, p_zona)
    or public.greenlog_has_scope('revisor', p_linea_operativa, p_zona);
$$;

alter table public.greenlog_usuarios enable row level security;
alter table public.greenlog_usuario_ambitos enable row level security;
alter table public.greenlog_actividades enable row level security;

drop policy if exists greenlog_usuarios_select_self_or_admin on public.greenlog_usuarios;
create policy greenlog_usuarios_select_self_or_admin
on public.greenlog_usuarios
for select
to authenticated
using (email = public.greenlog_current_email() or public.greenlog_is_admin());

drop policy if exists greenlog_usuarios_admin_all on public.greenlog_usuarios;
create policy greenlog_usuarios_admin_all
on public.greenlog_usuarios
for all
to authenticated
using (public.greenlog_is_admin())
with check (public.greenlog_is_admin());

drop policy if exists greenlog_usuario_ambitos_select_self_or_admin on public.greenlog_usuario_ambitos;
create policy greenlog_usuario_ambitos_select_self_or_admin
on public.greenlog_usuario_ambitos
for select
to authenticated
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
to authenticated
using (public.greenlog_is_admin())
with check (public.greenlog_is_admin());

drop policy if exists greenlog_actividades_select_scope on public.greenlog_actividades;
create policy greenlog_actividades_select_scope
on public.greenlog_actividades
for select
to authenticated
using (public.greenlog_can_view(linea_operativa, zona));

drop policy if exists greenlog_actividades_insert_planeador on public.greenlog_actividades;
create policy greenlog_actividades_insert_planeador
on public.greenlog_actividades
for insert
to authenticated
with check (public.greenlog_has_scope('planeador', linea_operativa, zona));

drop policy if exists greenlog_actividades_update_scope on public.greenlog_actividades;
create policy greenlog_actividades_update_scope
on public.greenlog_actividades
for update
to authenticated
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
to authenticated
using (public.greenlog_is_admin());

create or replace function public.greenlog_upsert_usuario(
  p_email text,
  p_nombre text,
  p_alcance text,
  p_base_trabajo text,
  p_zona_base text,
  p_admin boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.greenlog_usuarios (email, nombre, alcance, base_trabajo, zona_base, admin, activo)
  values (lower(p_email), p_nombre, p_alcance, p_base_trabajo, p_zona_base, p_admin, true)
  on conflict (email) do update set
    nombre = excluded.nombre,
    alcance = excluded.alcance,
    base_trabajo = excluded.base_trabajo,
    zona_base = excluded.zona_base,
    admin = excluded.admin,
    activo = true,
    actualizado_en = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.greenlog_add_ambito(
  p_email text,
  p_tipo text,
  p_linea_operativa text,
  p_zona text,
  p_global boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
begin
  select id into v_usuario_id
  from public.greenlog_usuarios
  where email = lower(p_email);

  if v_usuario_id is null then
    raise exception 'Usuario % no existe', p_email;
  end if;

  insert into public.greenlog_usuario_ambitos (usuario_id, tipo, linea_operativa, zona, global)
  values (v_usuario_id, p_tipo, p_linea_operativa, p_zona, p_global)
  on conflict (usuario_id, tipo, linea_operativa, zona) do update set
    global = excluded.global;
end;
$$;

do $$
declare
  v_all_lines text[] := array[
    'Monitoreos', 'ICAs', 'Pagos', 'S.Cumplimiento', 'S. Contigencias',
    'S. Viabilidad', 'S. Proyectos', 'Servicios E', 'Compensaciones estaciones',
    'Compensaciones e Inv', 'Compensaciones provisiones', 'Estudios Ambientales',
    'Servicios Generales', 'Hojas de Ruta Sostenibilidad Ambiental',
    'Residuos peligrosos', 'Herramienta Digital', 'Inversion Ambiental Voluntaria',
    'Obras por Impuestos'
  ];
  v_gestion_lines text[] := array[
    'ICAs', 'Compensaciones estaciones', 'Residuos peligrosos',
    'Estudios Ambientales', 'Monitoreos', 'Pagos', 'Servicios E',
    'Compensaciones provisiones'
  ];
  v_compensaciones text[] := array[
    'Compensaciones estaciones', 'Compensaciones provisiones', 'Compensaciones e Inv'
  ];
  v_zonas text[] := array['Occidente', 'Centro', 'CLC', 'Oriente', 'Llanos', 'Norte', 'Covenas'];
  v_linea text;
  v_zona text;
begin
  perform public.greenlog_upsert_usuario('camilo.ortegonc@outlook.com', 'Camilo Ortegon', 'Administrador temporal', 'Bogota', 'Transversal', true);
  perform public.greenlog_upsert_usuario('juan.cardenaso@cenit-transporte.com', 'Juan Helderth Cardenas Ospina', 'Jefe Ambiental', 'Bogota', 'Transversal', true);

  foreach v_linea in array v_all_lines loop
    perform public.greenlog_add_ambito('camilo.ortegonc@outlook.com', 'planeador', v_linea, '*', true);
    perform public.greenlog_add_ambito('camilo.ortegonc@outlook.com', 'revisor', v_linea, '*', true);
    perform public.greenlog_add_ambito('juan.cardenaso@cenit-transporte.com', 'planeador', v_linea, '*', true);
    perform public.greenlog_add_ambito('juan.cardenaso@cenit-transporte.com', 'revisor', v_linea, '*', true);
  end loop;

  perform public.greenlog_upsert_usuario('viviana.gonzalez@cenit-transporte.com', 'Viviana Gonzalez', 'Especialista HSE-Ambiental CENIT', 'Santa Marta', 'Norte-Covenas', false);
  foreach v_linea in array v_gestion_lines loop
    perform public.greenlog_add_ambito('viviana.gonzalez@cenit-transporte.com', 'planeador', v_linea, 'Norte', false);
    perform public.greenlog_add_ambito('viviana.gonzalez@cenit-transporte.com', 'planeador', v_linea, 'Covenas', false);
  end loop;

  perform public.greenlog_upsert_usuario('eliana.cortes@cenit-transporte.com', 'Eliana Cortes', 'Especialista HSE-Ambiental CENIT', 'Bogota', 'Oriente', false);
  foreach v_linea in array v_gestion_lines loop
    perform public.greenlog_add_ambito('eliana.cortes@cenit-transporte.com', 'planeador', v_linea, 'Oriente', false);
  end loop;
  perform public.greenlog_add_ambito('eliana.cortes@cenit-transporte.com', 'revisor', 'Monitoreos', 'Oriente', false);

  perform public.greenlog_upsert_usuario('luis.pelaez@cenit-transporte.com', 'Luis Alberto Pelaez', 'Especialista HSE-Ambiental CENIT', 'Cali', 'Occidente-Sur', false);
  perform public.greenlog_upsert_usuario('carmen.rosero@cenit-transporte.com', 'Carmen Rosero', 'Especialista HSE-Ambiental CENIT', 'Pereira', 'Occidente-Norte', false);
  foreach v_linea in array v_gestion_lines loop
    perform public.greenlog_add_ambito('luis.pelaez@cenit-transporte.com', 'planeador', v_linea, 'Occidente', false);
    perform public.greenlog_add_ambito('carmen.rosero@cenit-transporte.com', 'planeador', v_linea, 'Occidente', false);
  end loop;

  perform public.greenlog_upsert_usuario('javier.hernandez@cenit-transporte.com', 'Javier Hernandez', 'Especialista HSE-Ambiental CENIT', 'Cucuta', 'CLC', false);
  foreach v_linea in array v_gestion_lines loop
    perform public.greenlog_add_ambito('javier.hernandez@cenit-transporte.com', 'planeador', v_linea, 'CLC', false);
  end loop;

  perform public.greenlog_upsert_usuario('maria.puerto@cenit-transporte.com', 'Maria Ximena Puerto', 'Especialista HSE-Ambiental CENIT', 'Barrancabermeja', 'Centro', false);
  foreach v_linea in array v_gestion_lines loop
    perform public.greenlog_add_ambito('maria.puerto@cenit-transporte.com', 'planeador', v_linea, 'Centro', false);
  end loop;
  perform public.greenlog_add_ambito('maria.puerto@cenit-transporte.com', 'revisor', 'Residuos peligrosos', 'Centro', false);

  perform public.greenlog_upsert_usuario('paola.ferreira@cenit-transporte.com', 'Paola Ferreira', 'Especialista HSE-Ambiental CENIT', 'Villavicencio', 'Llanos', false);
  foreach v_linea in array v_gestion_lines loop
    perform public.greenlog_add_ambito('paola.ferreira@cenit-transporte.com', 'planeador', v_linea, 'Llanos', false);
  end loop;

  perform public.greenlog_upsert_usuario('viviana.buitrago@cenit-transporte.com', 'Viviana Buitrago', 'Especialista HSE-Ambiental CENIT', 'Bogota', 'Transversal', false);
  foreach v_zona in array v_zonas loop
    perform public.greenlog_add_ambito('viviana.buitrago@cenit-transporte.com', 'revisor', 'Servicios E', v_zona, true);
  end loop;

  perform public.greenlog_upsert_usuario('diana.basto@cenit-transporte.com', 'Diana Basto', 'Especialista HSE-Ambiental CENIT', 'Bogota', 'Transversal', false);
  foreach v_zona in array v_zonas loop
    perform public.greenlog_add_ambito('diana.basto@cenit-transporte.com', 'planeador', 'ICAs', v_zona, true);
    perform public.greenlog_add_ambito('diana.basto@cenit-transporte.com', 'planeador', 'Herramienta Digital', v_zona, true);
    perform public.greenlog_add_ambito('diana.basto@cenit-transporte.com', 'planeador', 'Pagos', v_zona, true);
    perform public.greenlog_add_ambito('diana.basto@cenit-transporte.com', 'revisor', 'ICAs', v_zona, true);
    perform public.greenlog_add_ambito('diana.basto@cenit-transporte.com', 'revisor', 'Herramienta Digital', v_zona, true);
    perform public.greenlog_add_ambito('diana.basto@cenit-transporte.com', 'revisor', 'Pagos', v_zona, true);
    foreach v_linea in array v_compensaciones loop
      perform public.greenlog_add_ambito('diana.basto@cenit-transporte.com', 'revisor', v_linea, v_zona, true);
    end loop;
  end loop;

  perform public.greenlog_upsert_usuario('edgar.yara@cenit-transporte.com', 'Andres Yara', 'Especialista HSE-Ambiental CENIT', 'Bogota', 'Transversal', false);
  perform public.greenlog_upsert_usuario('diego.enriquez@cenit-transporte.com', 'Diego Efren Enriquez', 'Especialista HSE-Ambiental CENIT', 'Bogota', 'Transversal', false);
end;
$$;

drop function if exists public.greenlog_upsert_usuario(text, text, text, text, text, boolean);
drop function if exists public.greenlog_add_ambito(text, text, text, text, boolean);
