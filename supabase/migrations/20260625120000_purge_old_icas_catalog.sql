-- ============================================================
-- Purga los ítems de ICAs del catálogo global (greenlog_catalogo_items)
-- que pertenecen al modelo ANTERIOR, antes del catálogo por
-- oleoducto / expediente / año (Plantilla PXQ2027).
--
-- Los ítems NUEVOS tienen item_key con el patrón ICA-2026-* / ICA-2027-*
-- y se conservan. Cualquier otro ítem de la línea 'ICAs' (p. ej.
-- 'ICAS-UNICO', 'ICAS-CONSOLIDACION', 'ICAS-001', etc.) se elimina.
--
-- Es idempotente: si no hay ítems viejos, no hace nada.
-- ============================================================

delete from public.greenlog_catalogo_items
where linea_operativa = 'ICAs'
  and item_key not like 'ICA-2026-%'
  and item_key not like 'ICA-2027-%';
