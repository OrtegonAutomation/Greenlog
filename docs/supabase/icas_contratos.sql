-- ICAs: contratista y contrato POR ÍTEM según la vigencia del ICA.
--   · Ítems ICA 2026 (key ICA-2026-%) → "ESTUDIOS TECNICOS SAS", contrato "8000008649"
--   · Ítems ICA 2027 (key ICA-2027-%) → "Nuevo contrato",        contrato "000"
--   · Ítems custom (CUSTOM-*, etc.) conservan el proveedor propio de la planeación.
--
-- ✔ EJECUTADO en producción el 2026-07-16 (respaldo previo en
--   public.greenlog_actividades_backup_icas_20260716). Se deja como referencia
--   e idempotente: se puede re-ejecutar sin efectos adversos.

-- Etiquetar cada ítem dentro del JSON de las planeaciones ICAs
update public.greenlog_actividades a
set opex_data_raw = jsonb_set(a.opex_data_raw, '{meses}', (
  select jsonb_agg(
    jsonb_set(t.m, '{preciosIndividuales}', coalesce((
      select jsonb_agg(
        case
          when p.p->>'key' like 'ICA-2026-%' then p.p || '{"contratista":"ESTUDIOS TECNICOS SAS","contrato":"8000008649"}'::jsonb
          when p.p->>'key' like 'ICA-2027-%' then p.p || '{"contratista":"Nuevo contrato","contrato":"000"}'::jsonb
          else p.p
        end order by p.ord)
      from jsonb_array_elements(t.m->'preciosIndividuales') with ordinality p(p, ord)
    ), '[]'::jsonb))
    order by t.ord)
  from jsonb_array_elements(a.opex_data_raw->'meses') with ordinality t(m, ord)
))
where a.linea_operativa = 'ICAs'
  and a.opex_data_raw ? 'meses'
  and jsonb_array_length(a.opex_data_raw->'meses') > 0;

-- Mismo dato en el catálogo de ítems ICAs (metadata)
update public.greenlog_catalogo_items
set metadata = metadata || '{"contratista":"ESTUDIOS TECNICOS SAS","contrato":"8000008649"}'::jsonb
where linea_operativa = 'ICAs' and item_key like 'ICA-2026-%';

update public.greenlog_catalogo_items
set metadata = metadata || '{"contratista":"Nuevo contrato","contrato":"000"}'::jsonb
where linea_operativa = 'ICAs' and item_key like 'ICA-2027-%';

-- Verificación: todos los ítems 2026/2027 quedan etiquetados
select
  count(*) filter (where p->>'key' like 'ICA-2026-%' and p->>'contratista' = 'ESTUDIOS TECNICOS SAS') as items_2026_ok,
  count(*) filter (where p->>'key' like 'ICA-2026-%' and p->>'contratista' is distinct from 'ESTUDIOS TECNICOS SAS') as items_2026_mal,
  count(*) filter (where p->>'key' like 'ICA-2027-%' and p->>'contratista' = 'Nuevo contrato') as items_2027_ok,
  count(*) filter (where p->>'key' like 'ICA-2027-%' and p->>'contratista' is distinct from 'Nuevo contrato') as items_2027_mal
from public.greenlog_actividades a,
     jsonb_array_elements(a.opex_data_raw->'meses') m,
     jsonb_array_elements(m->'preciosIndividuales') p
where a.linea_operativa = 'ICAs';
