// ============================================================
// Mock Service — Provisiones Ambientales
// Patrón idéntico a ActividadesService (in-memory STORE)
// ============================================================
import { Provision, NuevaProvisionPayload, EstadoProvision, TipoObligacion, CategoriaCompensacion, TipoCuentaProvision } from '../types/provisiones';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rndDelay = () => delay(200 + Math.random() * 350);

const ZONAS = ['Occidente', 'Centro', 'Oriente', 'Llanos', 'CLC', 'Norte', 'Coveñas'];
const RESPONSABLES = [
  'Eliana Cortes', 'Sonia Matiz', 'Maria Ximena Puerto', 'Claudia Falla',
  'Carmen Rosero', 'Javier Hernández', 'Darío Sánchez', 'Viviana González', 'Diana León',
];
const AUTORIDADES = ['CAR', 'ANLA', 'Cormacarena', 'Corpoboyacá', 'CAS', 'Corporinoquia', 'Cardique'];
const SISTEMAS = ['Poliducto', 'Oleoducto', 'Combustoleoducto', 'Propanoducto', 'Estación de Bombeo'];
const TRONCALES = ['Galán-Chimita', 'Pozos Colorados-Galán', 'Ayacucho-Coveñas', 'Caño Limón-Coveñas', 'Vasconia-Neiva'];
const MUNICIPIOS = ['Albán', 'Barrancabermeja', 'El Banco', 'Coveñas', 'Orito', 'Villeta', 'Puerto Salgar', 'Aguachica', 'Bucaramanga', 'Galán'];

const TIPOS: TipoObligacion[] = ['Compensación Forestal', 'Inversión 1%', 'Compensación Biótica', 'Ocupación Cauce', 'Plan de Manejo', 'Compensación Abiótica'];
const CATEGORIAS: CategoriaCompensacion[] = ['Restauración', 'Reforestación', 'Conservación', 'PSA', 'Uso Sostenible'];
const ESTADOS: EstadoProvision[] = ['Notificada', 'ID Generado', 'En Estimación', 'Solicitud Enviada', 'En Revisión Operaciones', 'Recursos Asignados', 'En Ejecución', 'En Facturación', 'Cerrada'];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rndBetween = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

function genProvision(i: number): Provision {
  const id = `COMP_${String(i).padStart(3, '0')}`;
  const zona = ZONAS[i % ZONAS.length];
  const tipoCuenta: TipoCuentaProvision = Math.random() > 0.3 ? 'OPEX' : 'CAPEX';
  const valorTotal = rndBetween(50_000_000, 8_000_000_000);
  const usoTotal = rndBetween(0, Math.floor(valorTotal * 0.8));
  const anio = rndBetween(2019, 2025);

  const valorAnual: Record<number, number> = {};
  const usoAnual: Record<number, number> = {};
  const usoProyectado: Record<number, number> = {};
  let restante = valorTotal;
  for (let y = anio; y <= 2026; y++) {
    const v = rndBetween(0, Math.floor(restante * 0.4));
    valorAnual[y] = v;
    usoAnual[y] = rndBetween(0, Math.floor(v * 0.7));
    restante -= v;
  }
  for (let y = 2027; y <= 2032; y++) {
    usoProyectado[y] = rndBetween(10_000_000, 500_000_000);
  }

  const costosMensuales = Array.from({ length: 12 }, () => rndBetween(5_000_000, 80_000_000));

  return {
    id,
    tipoObligacion: pick(TIPOS),
    estadoAvance: pick(ESTADOS),
    zona,
    sistema: pick(SISTEMAS),
    troncal: pick(TRONCALES),
    responsable: pick(RESPONSABLES),
    autoridadAmbiental: pick(AUTORIDADES),
    jurisdiccionCAR: pick(AUTORIDADES),
    numeroExpediente: `EXP-${rndBetween(1000, 9999)}-${rndBetween(2020, 2025)}`,
    actoAdministrativo: {
      tipo: pick(['Resolución', 'Auto', 'Concepto Técnico']),
      numero: `${rndBetween(100, 9999)}`,
      fecha: `${rndBetween(2019, 2025)}-${String(rndBetween(1, 12)).padStart(2, '0')}-${String(rndBetween(1, 28)).padStart(2, '0')}`,
    },
    departamento: pick(['Cundinamarca', 'Santander', 'Boyacá', 'Sucre', 'Norte de Santander', 'Meta', 'Casanare']),
    municipio: pick(MUNICIPIOS),
    medidaCompensacion: pick(['Reforestación protectora', 'Siembra de árboles nativos', 'Restauración ecológica', 'Conservación de bosque', 'PSA Hídrico']),
    categoria: pick(CATEGORIAS),
    tipoCuenta,
    contrato: 'BQS',
    ods: `ODS-${rndBetween(1000, 9999)}`,
    solped: `SOLPED-${rndBetween(10000, 99999)}`,
    valorProvisionTotal: valorTotal,
    usoProvisionTotal: usoTotal,
    saldoProvision: valorTotal - usoTotal,
    anioConstitucion: anio,
    valorProvisionAnual: valorAnual,
    usoProvisionAnual: usoAnual,
    usoProyectado,
    costosAdminMensuales: costosMensuales,
    creadoEn: new Date(rndBetween(2019, 2025), rndBetween(0, 11), rndBetween(1, 28)).toISOString(),
    actualizadoEn: new Date().toISOString(),
  };
}

const STORE: Provision[] = Array.from({ length: 15 }, (_, i) => genProvision(i + 1));

export const ProvisionesService = {
  async getAll(): Promise<Provision[]> {
    await rndDelay();
    return [...STORE];
  },

  async getById(id: string): Promise<Provision | undefined> {
    await rndDelay();
    return STORE.find((p) => p.id === id);
  },

  async create(payload: NuevaProvisionPayload): Promise<Provision> {
    await rndDelay();
    const nuevo: Provision = {
      ...payload,
      id: `COMP_${String(STORE.length + 1).padStart(3, '0')}`,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };
    STORE.push(nuevo);
    return nuevo;
  },

  async update(id: string, cambios: Partial<Provision>): Promise<Provision> {
    await rndDelay();
    const idx = STORE.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Provisión ${id} no encontrada`);
    STORE[idx] = { ...STORE[idx], ...cambios, actualizadoEn: new Date().toISOString() };
    return STORE[idx];
  },

  async delete(id: string): Promise<void> {
    await rndDelay();
    const idx = STORE.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Provisión ${id} no encontrada`);
    STORE.splice(idx, 1);
  },
};
