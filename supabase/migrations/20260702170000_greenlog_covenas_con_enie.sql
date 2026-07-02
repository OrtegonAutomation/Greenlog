-- ============================================================
-- Zona Coveñas: alinear ámbitos con el nombre real de la zona.
--
-- Las actividades guardan la zona como 'Coveñas' (con ñ), pero el
-- seed creó los ámbitos zonales como 'Covenas' (sin ñ). La función
-- greenlog_has_scope compara lower() exacto, así que los ámbitos
-- 'Covenas' no autorizan actividades de 'Coveñas' (403 al guardar).
--
-- Solución: duplicar todo ámbito con zona 'Covenas' hacia 'Coveñas'
-- (las filas viejas quedan; son inofensivas).
-- ============================================================

insert into public.greenlog_usuario_ambitos (usuario_id, tipo, linea_operativa, zona, global)
select a.usuario_id, a.tipo, a.linea_operativa, 'Coveñas', a.global
from public.greenlog_usuario_ambitos a
where a.zona = 'Covenas'
on conflict (usuario_id, tipo, linea_operativa, zona) do update set
  global = excluded.global;
