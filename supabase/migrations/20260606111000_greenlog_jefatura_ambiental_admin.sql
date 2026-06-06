-- Agrega el correo institucional de Jefatura Ambiental como administrador completo.

do $$
declare
  v_all_lines text[] := array[
    'Monitoreos',
    'ICAs',
    'Pagos',
    'S.Cumplimiento',
    'S. Contigencias',
    'S. Viabilidad',
    'S. Proyectos',
    'Servicios E',
    'Compensaciones estaciones',
    'Compensaciones e Inv',
    'Compensaciones provisiones',
    'Estudios Ambientales',
    'Servicios Generales',
    'Hojas de Ruta Sostenibilidad Ambiental',
    'Residuos peligrosos',
    'Herramienta Digital',
    'Inversion Ambiental Voluntaria',
    'Obras por Impuestos'
  ];
begin
  insert into public.greenlog_usuarios (
    email,
    nombre,
    alcance,
    base_trabajo,
    zona_base,
    admin,
    activo
  )
  values (
    'jefatura-ambiental@cenit-transporte.com',
    'Jefatura Ambiental',
    'Jefatura Ambiental',
    'Bogota',
    'Transversal',
    true,
    true
  )
  on conflict (email) do update set
    nombre = excluded.nombre,
    alcance = excluded.alcance,
    base_trabajo = excluded.base_trabajo,
    zona_base = excluded.zona_base,
    admin = excluded.admin,
    activo = excluded.activo;

  insert into public.greenlog_usuario_ambitos (
    usuario_id,
    tipo,
    linea_operativa,
    zona,
    global
  )
  select
    u.id,
    roles.tipo,
    lineas.linea_operativa,
    '*',
    true
  from public.greenlog_usuarios u
  cross join unnest(v_all_lines) as lineas(linea_operativa)
  cross join (values ('planeador'), ('revisor')) as roles(tipo)
  where u.email = 'jefatura-ambiental@cenit-transporte.com'
  on conflict (usuario_id, tipo, linea_operativa, zona) do update set
    global = excluded.global;
end $$;
