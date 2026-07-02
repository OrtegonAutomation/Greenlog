-- ============================================================
-- Hojas de Ruta Sostenibilidad Ambiental: habilitar planeación
-- para el equipo zonal.
--
-- Contexto: el frontend (LINEAS_GESTION_AMBIENTAL) ya incluye
-- 'Hojas de Ruta Sostenibilidad Ambiental' para los especialistas
-- de zona, pero el seed original de greenlog_usuario_ambitos no la
-- incluía. Resultado: el wizard permite crear la actividad pero la
-- policy greenlog_actividades_insert_planeador la rechaza (403).
--
-- Solución: dar ámbito planeador de esa línea a todo usuario que ya
-- tenga ámbito planeador de 'Monitoreos' (los especialistas de
-- gestión ambiental), replicando sus mismas zonas y flag global.
-- ============================================================

insert into public.greenlog_usuario_ambitos (usuario_id, tipo, linea_operativa, zona, global)
select distinct a.usuario_id,
       'planeador',
       'Hojas de Ruta Sostenibilidad Ambiental',
       a.zona,
       a.global
from public.greenlog_usuario_ambitos a
where a.tipo = 'planeador'
  and a.linea_operativa = 'Monitoreos'
on conflict (usuario_id, tipo, linea_operativa, zona) do update set
  global = excluded.global;
