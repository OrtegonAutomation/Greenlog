-- Catalogo de Necesidad (padre) -> Subnecesidad (hija) para Datos Auxiliares.
-- Listas obligatorias en la planeacion; cualquier planeador puede ampliarlas.

create table if not exists public.greenlog_necesidades (
  necesidad text not null,
  subnecesidad text not null,
  creado_por_email text,
  creado_en timestamptz not null default now(),
  constraint greenlog_necesidades_pk primary key (necesidad, subnecesidad)
);

alter table public.greenlog_necesidades enable row level security;

-- Lectura: cualquier usuario autenticado.
drop policy if exists greenlog_necesidades_select on public.greenlog_necesidades;
create policy greenlog_necesidades_select
on public.greenlog_necesidades
for select
to anon, authenticated
using (true);

-- Insercion: cualquier planeador (de cualquier linea/zona) o admin.
drop policy if exists greenlog_necesidades_insert on public.greenlog_necesidades;
create policy greenlog_necesidades_insert
on public.greenlog_necesidades
for insert
to anon, authenticated
with check (
  public.greenlog_is_admin()
  or exists (
    select 1
    from public.greenlog_usuarios u
    join public.greenlog_usuario_ambitos a on a.usuario_id = u.id
    where u.email = public.greenlog_current_email()
      and u.activo = true
      and a.tipo = 'planeador'
  )
);

-- Semilla del catalogo base.
insert into public.greenlog_necesidades (necesidad, subnecesidad) values
('GESTIÓN AMBIENTAL','Aseguramiento ICA''S'),
('GESTIÓN AMBIENTAL','Compensaciones De Estaciones'),
('GESTIÓN AMBIENTAL','Disposición RESPEL'),
('GESTIÓN AMBIENTAL','Hojas De Ruta Sostenibilidad'),
('GESTIÓN AMBIENTAL','Monitoreos Ambientales'),
('GESTIÓN AMBIENTAL','Pagos Y Publicaciones Autoridades Ambientales'),
('GESTIÓN AMBIENTAL','Servicios de estudios, permisos y autorizaciones'),
('INICIATIVAS TECNOLÓGICAS','Herramienta De Cumplimiento'),
('INICIATIVAS TECNOLÓGICAS','Iniciativa Digital - Gestión De Tierras Ambiental'),
('INICIATIVAS TECNOLÓGICAS','Mantenimiento herramienta'),
('SERVICIO HSE','Servicio E')
on conflict (necesidad, subnecesidad) do nothing;
