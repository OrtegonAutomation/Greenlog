// ============================================================
// Mock Service — Compensaciones Ambientales
// ============================================================
import { Compensacion, NuevaCompensacionPayload, EstadoCompensacion, CategoriaCompensacion, NivelRiesgo, InformeMantenimiento } from '../types/provisiones';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rndDelay = () => delay(200 + Math.random() * 350);

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rndBetween = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

const ZONAS = ['Occidente', 'Centro', 'Oriente', 'Llanos', 'CLC', 'Norte', 'Coveñas'];
const RESPONSABLES = ['Eliana Cortes', 'Maria Ximena Puerto', 'Carmen Rosero', 'Javier Hernández', 'Darío Sánchez', 'Viviana González', 'Diana León'];
const ESTADOS: EstadoCompensacion[] = ['Sin iniciar', 'En ejecución', 'Establecimiento', 'Mantenimiento', 'Cerrada'];
const CATEGORIAS: CategoriaCompensacion[] = ['Restauración', 'Reforestación', 'Conservación', 'PSA', 'Uso Sostenible'];
const RIESGOS: NivelRiesgo[] = ['Alto', 'Medio', 'Bajo'];
const MEDIDAS = ['Reforestación protectora', 'Siembra de especies nativas', 'Restauración ecológica', 'Conservación de bosque', 'Enriquecimiento forestal'];
const VEREDAS = ['Pantanillo', 'La Esperanza', 'El Porvenir', 'San José', 'La Cueva', 'El Rosario', 'Buenos Aires'];
const MUNICIPIOS = ['Albán', 'Barrancabermeja', 'El Banco', 'Coveñas', 'Puerto Salgar', 'Villeta', 'Aguachica', 'Orito'];

function genInformes(count: number): InformeMantenimiento[] {
  const informes: InformeMantenimiento[] = [];
  for (let i = 1; i <= 15; i++) {
    if (i <= count) {
      informes.push({
        numero: i,
        fecha: `${2020 + Math.floor(i / 3)}-${String(rndBetween(1, 12)).padStart(2, '0')}-15`,
        estado: pick(['Aprobado', 'Aprobado', 'Aprobado', 'Pendiente', 'En revisión']),
      });
    } else {
      informes.push({ numero: i });
    }
  }
  return informes;
}

function genCompensacion(i: number): Compensacion {
  const areaPlan = rndBetween(1, 150);
  const areaEjec = rndBetween(0, areaPlan);
  const estado = pick(ESTADOS);
  const informeCount = estado === 'Cerrada' ? rndBetween(10, 15)
    : estado === 'Mantenimiento' ? rndBetween(5, 10)
    : estado === 'En ejecución' ? rndBetween(1, 5)
    : estado === 'Establecimiento' ? rndBetween(0, 2)
    : 0;

  return {
    id: `COMP_C${String(i).padStart(3, '0')}`,
    provisionId: `COMP_${String(rndBetween(1, 15)).padStart(3, '0')}`,
    zona: pick(ZONAS),
    responsable: pick(RESPONSABLES),
    descripcionObligacion: pick([
      'Plantar 151 árboles nativos (Nacedero, Yarumo, Drago) en zona protectora',
      'Restauración ecológica de 5 ha en zona de ronda hídrica',
      'Reforestación protectora de 10 ha con especies nativas',
      'Conservación de 25 ha de bosque en zona de recarga hídrica',
      'Enriquecimiento forestal de 3 ha con 500 árboles nativos',
      'Siembra de 2000 árboles en compensación por aprovechamiento forestal',
    ]),
    medidaCompensacion: pick(MEDIDAS),
    categoria: pick(CATEGORIAS),
    areaPlaneadoHa: areaPlan,
    areaEjecutadoHa: areaEjec,
    cantidadArboles: rndBetween(50, 5000),
    fechaInicio: `${rndBetween(2020, 2024)}-${String(rndBetween(1, 12)).padStart(2, '0')}-01`,
    periodoDuracion: rndBetween(3, 10),
    fechaTerminacion: `${rndBetween(2026, 2032)}-${String(rndBetween(1, 12)).padStart(2, '0')}-30`,
    estado,
    departamento: pick(['Cundinamarca', 'Santander', 'Boyacá', 'Sucre', 'Meta']),
    municipio: pick(MUNICIPIOS),
    vereda: pick(VEREDAS),
    informesMantenimiento: genInformes(informeCount),
    riesgoReal: pick(RIESGOS),
    planAccion: estado === 'Cerrada' ? '' : pick([
      'Resiembra de individuos con mortalidad >10%',
      'Mantenimiento fitosanitario urgente por verano',
      'Gestión con propietario para acceso al predio',
      'Seguimiento a supervivencia de plantación',
      '',
    ]),
    prioritaria: Math.random() > 0.7,
    observaciones: pick([
      'Obligación con avance normal según cronograma',
      'Pendiente verificación de área por autoridad ambiental',
      'Riesgo de mortalidad por condiciones climáticas adversas',
      'Propietario no permite acceso — en gestión',
      'Último informe aprobado sin observaciones',
      '',
    ]),
    creadoEn: new Date(rndBetween(2020, 2025), rndBetween(0, 11), rndBetween(1, 28)).toISOString(),
    actualizadoEn: new Date().toISOString(),
  };
}

const STORE: Compensacion[] = Array.from({ length: 20 }, (_, i) => genCompensacion(i + 1));

export const CompensacionesService = {
  async getAll(): Promise<Compensacion[]> {
    await rndDelay();
    return [...STORE];
  },

  async getById(id: string): Promise<Compensacion | undefined> {
    await rndDelay();
    return STORE.find((c) => c.id === id);
  },

  async create(payload: NuevaCompensacionPayload): Promise<Compensacion> {
    await rndDelay();
    const nuevo: Compensacion = {
      ...payload,
      id: `COMP_C${String(STORE.length + 1).padStart(3, '0')}`,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };
    STORE.push(nuevo);
    return nuevo;
  },

  async update(id: string, cambios: Partial<Compensacion>): Promise<Compensacion> {
    await rndDelay();
    const idx = STORE.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Compensación ${id} no encontrada`);
    STORE[idx] = { ...STORE[idx], ...cambios, actualizadoEn: new Date().toISOString() };
    return STORE[idx];
  },

  async delete(id: string): Promise<void> {
    await rndDelay();
    const idx = STORE.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Compensación ${id} no encontrada`);
    STORE.splice(idx, 1);
  },
};
