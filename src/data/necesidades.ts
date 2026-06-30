// ============================================================
// Catálogo base de Necesidad (padre) → Subnecesidades (hijas).
// Semilla / fallback; el catálogo vigente se gestiona en Supabase
// (tabla greenlog_necesidades) y cualquier planeador puede ampliarlo.
// ============================================================

export type CatalogoNecesidades = Record<string, string[]>;

export const NECESIDADES_DEFAULT: CatalogoNecesidades = {
  'GESTIÓN AMBIENTAL': [
    "Aseguramiento ICA'S",
    'Compensaciones De Estaciones',
    'Disposición RESPEL',
    'Hojas De Ruta Sostenibilidad',
    'Monitoreos Ambientales',
    'Pagos Y Publicaciones Autoridades Ambientales',
    'Servicios de estudios, permisos y autorizaciones',
  ],
  'INICIATIVAS TECNOLÓGICAS': [
    'Herramienta De Cumplimiento',
    'Iniciativa Digital - Gestión De Tierras Ambiental',
    'Mantenimiento herramienta',
  ],
  'SERVICIO HSE': [
    'Servicio E',
  ],
};

/** Pares (necesidad, subnecesidad) del catálogo base, para sembrar la tabla. */
export const NECESIDADES_DEFAULT_PARES: Array<{ necesidad: string; subnecesidad: string }> =
  Object.entries(NECESIDADES_DEFAULT).flatMap(([necesidad, subs]) =>
    subs.map(subnecesidad => ({ necesidad, subnecesidad })));
