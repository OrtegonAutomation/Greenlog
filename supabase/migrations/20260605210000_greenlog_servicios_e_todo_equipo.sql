-- Habilita Servicios E para todo el equipo ambiental en el piloto GreenLog.
-- Mantiene alcance transversal en todas las zonas normalizadas para planeacion y revision.

with usuarios as (
  select id
  from public.greenlog_usuarios
  where email in (
    'viviana.gonzalez@cenit-transporte.com',
    'eliana.cortes@cenit-transporte.com',
    'luis.pelaez@cenit-transporte.com',
    'javier.hernandez@cenit-transporte.com',
    'maria.puerto@cenit-transporte.com',
    'paola.ferreira@cenit-transporte.com',
    'carmen.rosero@cenit-transporte.com',
    'viviana.buitrago@cenit-transporte.com',
    'diana.basto@cenit-transporte.com',
    'edgar.yara@cenit-transporte.com',
    'diego.enriquez@cenit-transporte.com'
  )
),
zonas(zona) as (
  values
    ('Norte'),
    ('Coveñas'),
    ('Oriente'),
    ('Occidente'),
    ('Centro'),
    ('Llanos'),
    ('CLC'),
    ('Transversal')
),
ambitos(tipo, linea_operativa, zona, global) as (
  select 'planeador', 'Servicios E', zona, true from zonas
  union all
  select 'revisor', 'Servicios E', zona, true from zonas
)
insert into public.greenlog_usuario_ambitos (usuario_id, tipo, linea_operativa, zona, global)
select usuarios.id, ambitos.tipo, ambitos.linea_operativa, ambitos.zona, ambitos.global
from usuarios
cross join ambitos
on conflict (usuario_id, tipo, linea_operativa, zona) do update set
  global = excluded.global;
