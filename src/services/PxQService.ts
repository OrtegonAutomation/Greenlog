// ============================================================
// Mock Service — PxQ (Price x Quantity)
// ============================================================
import { ItemPxQ } from '../types/provisiones';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rndDelay = () => delay(200 + Math.random() * 350);

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rndBetween = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

const ZONAS = ['Norte', 'Coveñas', 'Occidente', 'Centro', 'Oriente', 'Llanos', 'CLC'];
const STHS = [
  'Poliducto Pozos Colorados - Galán 14"',
  'Oleoducto Ayacucho - Coveñas',
  'Combustoleoducto Galán-Ayacucho-Coveñas',
  'Oleoducto Caño Limón - Coveñas',
  'Propanoducto Vasconia',
];
const MUNICIPIOS = ['El Banco', 'Coveñas', 'Albán', 'Barrancabermeja', 'Puerto Salgar', 'Villeta', 'Aguachica'];
const DESCRIPCIONES = [
  'Control fitosanitario biológico por aspersión',
  'Siembra de especies nativas (Nacedero, Yarumo, Drago)',
  'Aislamiento y protección con cerca - instalación postes',
  'Mantenimiento año 1 - plateo, fertilización',
  'Mantenimiento año 2 - control de arvenses',
  'Mantenimiento año 3 - resiembra mortalidad',
  'Monitoreo de supervivencia de plantación',
  'Transporte de material vegetal',
  'Preparación de terreno y ahoyado',
  'Enriquecimiento forestal con especies amenazadas',
  'Restauración ecológica activa',
  'Cerramiento con cerca eléctrica',
];
const UNIDADES = ['Hectárea', 'Unidad', 'Metro lineal', 'Global', 'Jornal', 'Kilómetro'];

function genItem(i: number): ItemPxQ {
  const compNum = Math.ceil(i / 4); // ~4 items per COMP
  const zona = ZONAS[compNum % ZONAS.length];
  const desc = DESCRIPCIONES[i % DESCRIPCIONES.length];
  const unidad = pick(UNIDADES);
  const cantidad = rndBetween(1, 500);
  const valorUnitario = rndBetween(50_000, 2_000_000);
  const totalBase = cantidad * valorUnitario;

  const totalAnual: Record<number, number> = {};
  for (let y = 2025; y <= 2030; y++) {
    totalAnual[y] = Math.random() > 0.3 ? Math.round(totalBase * (0.5 + Math.random() * 0.8)) : 0;
  }

  return {
    id: `PXQ_${String(i).padStart(3, '0')}`,
    provisionId: `COMP_${String(compNum).padStart(3, '0')}`,
    sth: pick(STHS),
    zona,
    municipio: pick(MUNICIPIOS),
    itemContrato: String(rndBetween(1, 80)),
    descripcion: desc,
    unidad,
    cantidad,
    valorUnitario,
    totalAnual,
    solped: `SOLPED-${rndBetween(10000, 99999)}`,
    posicion: String(rndBetween(1, 20)),
  };
}

const STORE: ItemPxQ[] = Array.from({ length: 30 }, (_, i) => genItem(i + 1));

export const PxQService = {
  async getAll(): Promise<ItemPxQ[]> {
    await rndDelay();
    return [...STORE];
  },

  async getByProvision(provisionId: string): Promise<ItemPxQ[]> {
    await rndDelay();
    return STORE.filter((item) => item.provisionId === provisionId);
  },
};
