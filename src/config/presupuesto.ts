// ============================================================
// Estado del ciclo presupuestal.
//
// MATRIZ_FINANCIERA_ENVIADA = true congela la edición del
// presupuesto en la UI (el bloqueo real también está en las
// políticas RLS de Supabase: migración 20260703100000).
// Para reabrir la edición: poner en false y, en la BD,
//   update greenlog_config set valor='false'
//   where clave='presupuesto_congelado';
// ============================================================

export const MATRIZ_FINANCIERA_ENVIADA = true;

export const MSG_MATRIZ_ENVIADA =
  'La matriz financiera ya fue enviada a Financiera: el presupuesto está congelado y no se puede crear, editar ni eliminar planeaciones.';
