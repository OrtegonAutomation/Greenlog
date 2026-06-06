import { LineaOperativa } from '../types';
import { getSupabaseClient, isSupabaseEnabled } from './supabaseClient';
import { ItemLinea } from './ItemsLineaService';

const TABLE = 'greenlog_catalogo_items';
const MESES_COUNT = 12;

type CatalogoItemRow = {
  id: string;
  item_key: string;
  linea_operativa: string;
  item: string;
  descripcion: string | null;
  unidad: string | null;
  precio_referencia: number | null;
  precios_mensuales: Record<string, number> | null;
  zona_scope: string | null;
  estacion: string | null;
  metadata: Record<string, unknown> | null;
  activo: boolean;
};

export interface CatalogoItemContext {
  zona?: string;
  estacion?: string;
}

const normalizeZonaScope = (zona?: string) => {
  const value = (zona ?? '').trim();
  return value || '*';
};

const normalizePreciosMensuales = (value?: Record<number, number>) => {
  if (!value) return null;
  const entries = Object.entries(value)
    .map(([key, price]) => [String(Number(key)), Number(price)] as const)
    .filter(([key, price]) => Number.isInteger(Number(key)) && Number(key) >= 0 && Number(key) < MESES_COUNT && Number.isFinite(price));

  return entries.length > 0 ? Object.fromEntries(entries) : null;
};

const mapRowToItem = (row: CatalogoItemRow): ItemLinea => ({
  id: row.item_key,
  lineaOperativa: row.linea_operativa as LineaOperativa,
  item: row.item,
  descripcion: row.descripcion || row.item,
  unidad: row.unidad || 'Global',
  precioReferencia: Number(row.precio_referencia ?? 0),
  preciosMensuales: row.precios_mensuales
    ? Object.fromEntries(Object.entries(row.precios_mensuales).map(([key, value]) => [Number(key), Number(value)]))
    : undefined,
  catalogoGlobalId: row.id,
  catalogSource: 'global',
  zonaCatalogo: row.zona_scope || '*',
  ...(row.metadata ?? {}),
});

export const CatalogoItemsGlobalService = {
  async getItems(linea: LineaOperativa, zona?: string): Promise<ItemLinea[]> {
    if (!isSupabaseEnabled()) return [];

    const zonaScope = normalizeZonaScope(zona);
    const scopes = zonaScope === '*' ? ['*'] : ['*', zonaScope];
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('linea_operativa', linea)
      .eq('activo', true)
      .in('zona_scope', scopes)
      .order('actualizado_en', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(row => mapRowToItem(row as CatalogoItemRow));
  },

  async upsertItem(item: ItemLinea, context: CatalogoItemContext = {}): Promise<ItemLinea | null> {
    if (!isSupabaseEnabled()) return null;

    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email?.toLowerCase() ?? null;
    const zonaScope = normalizeZonaScope(context.zona ?? item.zonaCatalogo);
    const metadata = {
      tipoIca: item.tipoIca,
      zonaIca: item.zonaIca,
      baseServicio: item.baseServicio,
      ordenInterna: item.ordenInterna,
      cuentaContable: item.cuentaContable,
      servicioEZona: item.servicioEZona,
      servicioEBase: item.servicioEBase,
      servicioEComplejidad: item.servicioEComplejidad,
      requiereComplejidad: item.requiereComplejidad,
    };

    const row = {
      item_key: item.id,
      linea_operativa: item.lineaOperativa,
      item: item.item,
      descripcion: item.descripcion || item.item,
      unidad: item.unidad || 'Global',
      precio_referencia: item.precioReferencia || 0,
      precios_mensuales: normalizePreciosMensuales(item.preciosMensuales),
      zona_scope: zonaScope,
      estacion: context.estacion ?? null,
      metadata: Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined)),
      activo: true,
      creado_por_email: email,
      actualizado_por_email: email,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(row, { onConflict: 'linea_operativa,item_key,zona_scope' })
      .select('*')
      .single();

    if (error) throw error;
    return mapRowToItem(data as CatalogoItemRow);
  },
};
