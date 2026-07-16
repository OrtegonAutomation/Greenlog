-- ICAs: asignación de contratista y contrato por año de planeación.
-- Ejecutar en el SQL Editor del proyecto Supabase de GreenLog.
--   · 2026 → contratista "ESTUDIOS TECNICOS SAS", contrato "8000008649"
--   · 2027 → contratista "Nuevo contrato",        contrato "000"
-- Actualiza tanto la columna `contrato` como la copia histórica en opex_data_raw
-- (campos proveedor y contrato del JSON).

-- 2026
update public.greenlog_actividades
set contrato = '8000008649',
    opex_data_raw = jsonb_set(
      jsonb_set(coalesce(opex_data_raw, '{}'::jsonb), '{proveedor}', '"ESTUDIOS TECNICOS SAS"'),
      '{contrato}', '"8000008649"'
    )
where linea_operativa = 'ICAs'
  and coalesce(anio_planeacion, (opex_data_raw->>'anioPlaneacion')::int) = 2026;

-- 2027
update public.greenlog_actividades
set contrato = '000',
    opex_data_raw = jsonb_set(
      jsonb_set(coalesce(opex_data_raw, '{}'::jsonb), '{proveedor}', '"Nuevo contrato"'),
      '{contrato}', '"000"'
    )
where linea_operativa = 'ICAs'
  and coalesce(anio_planeacion, (opex_data_raw->>'anioPlaneacion')::int) = 2027;

-- Verificación
select id, tarea, anio_planeacion, contrato,
       opex_data_raw->>'proveedor' as proveedor_json,
       opex_data_raw->>'contrato'  as contrato_json
from public.greenlog_actividades
where linea_operativa = 'ICAs'
order by anio_planeacion, id;
