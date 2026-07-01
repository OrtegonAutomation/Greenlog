import React, { useMemo, useState } from 'react';
import {
  makeStyles, mergeClasses, shorthands, tokens,
  Title2, Title3, Body1, Caption1, Card, Button, Spinner, Select,
} from '@fluentui/react-components';
import { ArrowTrendingLinesRegular, DataBarVerticalRegular, FilterRegular, ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Cell, ReferenceLine, ComposedChart, Line, LabelList,
} from 'recharts';
import { useActividades } from '../../hooks/useActividades';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import { MEDIA } from '../../hooks/useResponsive';
import {
  actividadesAnio, resumenComparacion, comparacionPorZona, comparacionPorLinea,
  paretoLineas, concentracionTop, cajaMensual, dependenciaProveedores,
  exposicionPorLinea, heatmapZonaLinea, fmtB, fmtPct,
  baseline2026Filtrada, mapPorZona, mapPorLinea, porZona2027, total2027,
} from '../../utils/reportesAggregations';
import { exportReporteToExcel } from '../../utils/exportReporte';
import { ColombiaMapa } from './ColombiaMapa';

// Paleta alineada al diseño AIDesigner.
const AZUL = '#264b96', NARANJA = '#c05a1e', VERDE = '#48946e', ROJO = '#d64545', MORADO = '#5b3fd6';
const AZUL_OSCURO = '#112240', GREENLIGHT = '#ebf6f0';

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', ...shorthands.gap(tokens.spacingVerticalL) },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
    backdropFilter: 'blur(10px)', ...shorthands.padding('24px'), borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(255,255,255,0.5)',
    [MEDIA.mobile]: { ...shorthands.padding('16px') },
  },
  headerLeft: { display: 'flex', flexDirection: 'column', ...shorthands.gap('4px') },
  filterBar: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', ...shorthands.gap('10px'),
    ...shorthands.padding('12px', '16px'), borderRadius: '12px',
    background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.6)',
  },
  filterItem: { display: 'flex', flexDirection: 'column', ...shorthands.gap('2px') },
  filterLabel: { fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground3 },
  // --- Layout overlay tipo diseño AIDesigner: mapa de fondo + contenido flotando ---
  heroOverlay: {
    position: 'relative', minHeight: '640px', ...shorthands.padding('4px'), overflow: 'hidden',
    [MEDIA.mobile]: { minHeight: 'auto', overflow: 'visible' },
  },
  heroMapBg: {
    position: 'absolute', top: '-40px', right: '4%', width: '58%', height: '640px',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    pointerEvents: 'none', zIndex: 0,
    [MEDIA.mobile]: { position: 'relative', width: '100%', height: 'auto', right: 0, marginTop: '16px', order: 2 },
  },
  heroMapInner: { width: '100%', maxWidth: '700px', pointerEvents: 'auto' },
  heroContent: {
    position: 'relative', zIndex: 2, width: '52%', maxWidth: '560px', display: 'flex', flexDirection: 'column',
    [MEDIA.mobile]: { width: '100%', maxWidth: '100%' },
  },
  // Fila superior: tarjeta de presupuesto a la izquierda y Evolución a la derecha.
  heroTopRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', ...shorthands.gap('12px'), alignItems: 'stretch',
    [MEDIA.mobile]: { gridTemplateColumns: '1fr' },
  },
  // Bloque de título flotante en la esquina superior derecha del mapa
  heroCaption: {
    position: 'absolute', right: '2%', top: 0, zIndex: 2, maxWidth: '300px', textAlign: 'right',
    pointerEvents: 'none',
    [MEDIA.mobile]: { position: 'relative', right: 0, top: 0, textAlign: 'left', maxWidth: '100%', marginTop: '12px', order: 3 },
  },
  hero: {
    display: 'grid', gridTemplateColumns: '360px 1fr', ...shorthands.gap('16px'), alignItems: 'stretch',
    [MEDIA.mobile]: { gridTemplateColumns: '1fr' },
  },
  heroPanel: {
    ...shorthands.padding('22px'), display: 'flex', flexDirection: 'column', ...shorthands.gap('14px'),
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.7)',
  },
  eyebrow: { fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: tokens.colorNeutralForeground3, textTransform: 'uppercase' },
  heroTitle: { fontSize: '30px', fontWeight: 800, color: '#003057', lineHeight: 1.05 },
  bigCard: {
    ...shorthands.padding('12px', '14px'), borderRadius: '14px', background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
    display: 'flex', flexDirection: 'column', ...shorthands.gap('3px'),
  },
  bigValue: { fontSize: '27px', fontWeight: 800, color: '#003057', lineHeight: 1 },
  // Variante compacta de chartCard para las tarjetas del hero (panel izquierdo).
  heroChartCard: { ...shorthands.padding('14px'), rowGap: '2px' },
  pill: { display: 'inline-flex', alignItems: 'center', ...shorthands.gap('4px'), fontSize: '12px', fontWeight: 700, ...shorthands.padding('2px', '8px'), borderRadius: '999px', width: 'fit-content' },
  miniRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', ...shorthands.gap('8px') },
  miniKpi: { ...shorthands.padding('10px', '10px'), borderRadius: '12px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', ...shorthands.gap('2px') },
  miniLabel: { fontSize: '10px', fontWeight: 600, color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.2px' },
  miniValue: { fontSize: '17px', fontWeight: 800, color: '#003057', lineHeight: 1.1 },
  mapPanel: {
    ...shorthands.padding('12px'), borderRadius: '18px', background: 'rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', minHeight: '440px', justifyContent: 'center',
  },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', ...shorthands.gap('16px'), [MEDIA.mobile]: { gridTemplateColumns: '1fr' } },
  heroKpis: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', ...shorthands.gap('10px'), marginBottom: '10px' },
  heroKpi: { ...shorthands.padding('12px', '14px'), borderRadius: '12px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.8)' },
  fade: {
    animationName: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
    animationDuration: '0.4s', animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
  },
  // --- Navegación por vistas (hero → comparación → composición) ---
  navRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...shorthands.gap('10px') },
  navDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(0,48,87,0.2)', transition: 'all 0.3s ease', cursor: 'pointer' },
  navDotActiva: { width: '22px', borderRadius: '99px', background: '#264b96' },
  // Slide: entra deslizándose con un resorte suave.
  slide: {
    animationName: { from: { opacity: '0', transform: 'translateX(36px) scale(0.985)' }, to: { opacity: '1', transform: 'translateX(0) scale(1)' } },
    animationDuration: '0.5s', animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
    display: 'flex', flexDirection: 'column', ...shorthands.gap('16px'),
  },
  slideBack: {
    animationName: { from: { opacity: '0', transform: 'translateX(-36px) scale(0.985)' }, to: { opacity: '1', transform: 'translateX(0) scale(1)' } },
    animationDuration: '0.5s', animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
    display: 'flex', flexDirection: 'column', ...shorthands.gap('16px'),
  },
  // Mini-mapa clicable (esquina superior izquierda en las vistas 2 y 3).
  miniMapa: {
    width: '250px', cursor: 'pointer', ...shorthands.padding('10px', '12px'), borderRadius: '14px',
    background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
    transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
    ':hover': { transform: 'scale(1.05)', boxShadow: '0 12px 32px rgba(0,48,87,0.15)' },
    ':active': { transform: 'scale(0.97)' },
    animationName: { from: { opacity: '0', transform: 'scale(0.7) translateY(-8px)' }, to: { opacity: '1', transform: 'scale(1) translateY(0)' } },
    animationDuration: '0.5s', animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
  },
  kpiGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', ...shorthands.gap('16px'),
    [MEDIA.mobile]: { gridTemplateColumns: 'repeat(2, 1fr)', ...shorthands.gap('12px') },
  },
  kpiCard: {
    ...shorthands.padding('18px'), display: 'flex', flexDirection: 'column', ...shorthands.gap('4px'),
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.8)', borderRadius: '14px',
  },
  kpiLabel: { color: tokens.colorNeutralForeground3, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' },
  kpiValue: { fontSize: '30px', [MEDIA.mobile]: { fontSize: '24px' }, fontWeight: 800, color: '#003057', lineHeight: 1 },
  kpiSub: { color: tokens.colorNeutralForeground3, fontSize: '11px' },
  sectionTitle: { color: '#003057', fontWeight: 700, marginTop: '8px' },
  grid2: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', ...shorthands.gap('16px'),
    [MEDIA.mobile]: { gridTemplateColumns: '1fr' },
  },
  chartCard: {
    ...shorthands.padding('20px'), background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)',
    borderRadius: '18px', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
    display: 'flex', flexDirection: 'column', ...shorthands.gap('4px'),
  },
  chartTitle: { color: '#003057', fontWeight: 700, fontSize: '15px' },
  chartHint: { color: tokens.colorNeutralForeground3, fontSize: '11px', marginBottom: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' },
  th: { textAlign: 'left', padding: '8px 10px', color: '#003057', fontWeight: 700, borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(248,250,252,0.7)' },
  td: { padding: '8px 10px', borderBottom: '1px solid rgba(0,0,0,0.04)' },
});

const fmtAxis = (v: number) => `$${(v / 1e9).toFixed(1)} MM`;
// Vistas del reporte (navegación por flechas).
const VISTAS = ['Explora por zona', 'Comparación 2026 vs 2027', 'Análisis por zona'];
// Etiqueta sobre la barra en una sola línea (el LabelList por defecto envuelve
// el texto al ancho de la barra y se corta contra el borde superior).
const BarLabel = ({ x, y, width, value }: any) => (
  <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} textAnchor="middle"
    fontSize={10} fontWeight={800} fill="#003057">{fmtB(Number(value))}</text>
);
const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {fmtB(p.value)}</div>
      ))}
    </div>
  );
};

export const ReportesModule: React.FC = () => {
  const styles = useStyles();
  const { actividades, cargando, errorCarga } = useActividades();

  const [filtroLinea, setFiltroLinea] = useState('Todas');
  const [filtroZona, setFiltroZona] = useState('Todas');
  // Vista actual del reporte (0=Explora por zona, 1=Comparación, 2=Composición y control)
  // y dirección del último cambio para animar el slide.
  const [vista, setVista] = useState(0);
  const [dirAtras, setDirAtras] = useState(false);
  const irAVista = (v: number) => { setDirAtras(v < vista); setVista(v); };
  const [filtroTipo, setFiltroTipo] = useState('Todos'); // Todos | OPEX | CAPEX

  // Opciones de filtro (de todas las actividades 2027, sin filtrar).
  const opciones = useMemo(() => {
    const base = actividadesAnio(actividades, 2027);
    const lineas = [...new Set(base.map(a => a.lineaOperativa).filter(Boolean))].sort();
    const zonas = [...new Set(base.map(a => a.zona).filter(Boolean))].sort();
    const tipos = [...new Set(base.map(a => (a.fuentePresupuesto as string) || 'OPEX'))].sort();
    return { lineas, zonas, tipos };
  }, [actividades]);

  const R = useMemo(() => {
    const acts = actividadesAnio(actividades, 2027).filter(a =>
      (filtroLinea === 'Todas' || a.lineaOperativa === filtroLinea) &&
      (filtroZona === 'Todas' || a.zona === filtroZona) &&
      (filtroTipo === 'Todos' || ((a.fuentePresupuesto as string) || 'OPEX') === filtroTipo));

    // Base 2026 filtrada por zona/línea. El tipo CAPEX/OPEX no aplica a la base (es OPEX):
    // si se filtra CAPEX, no hay base 2026 comparable -> base vacía.
    const baseAplica = filtroTipo !== 'CAPEX';
    const baseCeldas = baseAplica ? baseline2026Filtrada(filtroZona, filtroLinea) : [];
    const baseZona = mapPorZona(baseCeldas);
    const baseLinea = mapPorLinea(baseCeldas);
    const totalBase = baseCeldas.reduce((s, c) => s + c.valor, 0);

    // Presupuesto por zona para el MAPA: respeta filtros de línea/tipo pero NO el de zona,
    // para que el mapa siempre muestre todas las zonas y se pueda clicar cualquiera.
    const actsSinZona = actividadesAnio(actividades, 2027).filter(a =>
      (filtroLinea === 'Todas' || a.lineaOperativa === filtroLinea) &&
      (filtroTipo === 'Todos' || ((a.fuentePresupuesto as string) || 'OPEX') === filtroTipo));
    const mapaPorZona = porZona2027(actsSinZona);

    const resumen = resumenComparacion(acts, totalBase);
    const compZona = comparacionPorZona(acts, baseZona);
    const compLinea = comparacionPorLinea(acts, baseLinea);
    const pareto = paretoLineas(acts);
    const caja = cajaMensual(acts);
    const proveedores = dependenciaProveedores(acts);
    const exposicion = exposicionPorLinea(acts);
    const heat = heatmapZonaLinea(acts);
    const conc = concentracionTop(acts, 3);
    // Todas las líneas operativas del ámbito, ordenadas de mayor a menor presupuesto.
    const lineasOrdenadas = pareto.filas;
    const totalNacional = total2027(actsSinZona) || 1;
    const participacion = (resumen.total2027 / totalNacional) * 100;
    // Crecimiento por zona para la etiqueta del mapa (2027 vs base 2026, respeta línea/tipo).
    const baseMapaCeldas = filtroTipo !== 'CAPEX' ? baseline2026Filtrada('Todas', filtroLinea) : [];
    const base2026Zona = mapPorZona(baseMapaCeldas);
    const crecimientoPorZona: Record<string, number | null> = {};
    const deltaPorZona: Record<string, number> = {};
    for (const z of Object.keys(mapaPorZona)) {
      const b = base2026Zona[z] ?? 0;
      crecimientoPorZona[z] = b > 0 ? (mapaPorZona[z] - b) / b : null;
      deltaPorZona[z] = mapaPorZona[z] - b;
    }
    const nEstaciones = new Set(acts.map(a => a.estacion).filter(Boolean)).size;
    const resumenAmbito = { participacion, nActividades: acts.length, nEstaciones, rubroTop: pareto.filas[0]?.nombre ?? '—' };
    return { acts, resumen, compZona, compLinea, pareto, caja, proveedores, exposicion, heat, conc, mapaPorZona, lineasOrdenadas, resumenAmbito, crecimientoPorZona, deltaPorZona };
  }, [actividades, filtroLinea, filtroZona, filtroTipo]);

  const { resumen, compZona, compLinea, pareto, caja, proveedores, exposicion, heat, conc } = R;

  const rubroDominante = pareto.filas[0];
  const zonaMayor = [...compZona].sort((a, b) => b.delta - a.delta)[0];

  // Encabezado común (siempre visible).
  const Header = (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <Title2 style={{ color: '#003057', fontWeight: 700 }}>Reportes — Análisis financiero OPEX</Title2>
        <Body1 style={{ color: tokens.colorNeutralForeground2 }}>
          Comparación presupuestal 2026 vs 2027, concentración, caja, riesgo contractual y proveedores.
        </Body1>
      </div>
      <Button appearance="secondary" icon={<ArrowTrendingLinesRegular />}
        disabled={cargando || R.acts.length === 0}
        style={{ borderRadius: 8 }}
        onClick={() => exportReporteToExcel(actividades, 2027)}>
        Descargar reporte
      </Button>
    </div>
  );

  // Barra de filtros (Línea, Zona, Tipo de presupuesto).
  const Filtros = (
    <div className={styles.filterBar}>
      <FilterRegular style={{ color: tokens.colorNeutralForeground3 }} />
      <div className={styles.filterItem}>
        <span className={styles.filterLabel}>Línea operativa</span>
        <Select size="small" value={filtroLinea} onChange={(_, d) => setFiltroLinea(d.value)} style={{ minWidth: 170 }}>
          <option value="Todas">Todas las líneas</option>
          {opciones.lineas.map(l => <option key={l} value={l}>{l}</option>)}
        </Select>
      </div>
      <div className={styles.filterItem}>
        <span className={styles.filterLabel}>Tipo de presupuesto</span>
        <Select size="small" value={filtroTipo} onChange={(_, d) => setFiltroTipo(d.value)} style={{ minWidth: 120 }}>
          <option value="Todos">Todos</option>
          {opciones.tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      {(filtroLinea !== 'Todas' || filtroZona !== 'Todas' || filtroTipo !== 'Todos') && (
        <Button size="small" appearance="subtle" onClick={() => { setFiltroLinea('Todas'); setFiltroZona('Todas'); setFiltroTipo('Todos'); }}>
          Limpiar
        </Button>
      )}
      {filtroTipo === 'CAPEX' && (
        <Caption1 style={{ color: '#c05a1e' }}>La línea base 2026 es OPEX; la comparación no aplica para CAPEX.</Caption1>
      )}
    </div>
  );

  // Estado de carga: NO mostrar cifras hasta tener los datos reales (evita el "flash" de datos sin sentido).
  if (cargando) {
    return (
      <div className={styles.root}>
        {Header}
        <Card className={styles.chartCard} style={{ alignItems: 'center', padding: '64px 24px' }}>
          <Spinner size="large" label="Cargando información del presupuesto…" />
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: 12 }}>
            Preparando la comparación 2026 vs 2027 con los datos actuales.
          </Caption1>
        </Card>
      </div>
    );
  }

  // Sin actividades del año: mensaje claro (no cifras engañosas).
  if (R.acts.length === 0) {
    return (
      <div className={styles.root}>
        {Header}
        {Filtros}
        <Card className={styles.chartCard} style={{ alignItems: 'center', padding: '64px 24px', gap: 8 }}>
          <DataBarVerticalRegular fontSize={40} color={tokens.colorNeutralForeground3} />
          <Title3 style={{ color: '#003057' }}>Sin datos para el análisis</Title3>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', maxWidth: 460 }}>
            {errorCarga
              ? errorCarga
              : 'Aún no hay planeaciones registradas para 2027. El análisis financiero se mostrará cuando existan actividades.'}
          </Caption1>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {Header}
      {Filtros}

      {/* Navegación por vistas: hero → comparación → composición */}
      <div className={styles.navRow}>
        <Button appearance="subtle" icon={<ChevronLeftRegular />} disabled={vista === 0} onClick={() => irAVista(vista - 1)}>Anterior</Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {VISTAS.map((t, i) => (
            <span key={t} className={mergeClasses(styles.navDot, vista === i && styles.navDotActiva)} title={t} onClick={() => irAVista(i)} />
          ))}
          <Caption1 style={{ marginLeft: 6, color: '#003057', fontWeight: 600 }}>{VISTAS[vista]}</Caption1>
        </div>
        <Button appearance="subtle" icon={<ChevronRightRegular />} iconPosition="after" disabled={vista === VISTAS.length - 1} onClick={() => irAVista(vista + 1)}>Siguiente</Button>
      </div>

      {/* Contenido que reacciona a filtros y a la vista (slide animado) */}
      <div key={`${filtroLinea}|${filtroZona}|${filtroTipo}|${vista}`} className={dirAtras ? styles.slideBack : styles.slide}>

      {/* A. Hero overlay: mapa de fondo + contenido flotando encima (estilo diseño) */}
      {vista === 0 && (
      <div className={styles.heroOverlay}>
        {/* Mapa de fondo, a la derecha, ocupando el alto */}
        <div className={styles.heroMapBg}>
          <div className={styles.heroMapInner}>
            <ColombiaMapa presupuestoPorZona={R.mapaPorZona} crecimientoPorZona={R.crecimientoPorZona} deltaPorZona={R.deltaPorZona} zonaSel={filtroZona} onSelectZona={setFiltroZona} />
          </div>
        </div>

        {/* Contenido flotante (izquierda): fila presupuesto + evolución, y líneas debajo */}
        <div className={styles.heroContent}>
          <div className={styles.heroTopRow}>
          <div className={styles.bigCard}>
            <span className={styles.kpiLabel}>Presupuesto 2027</span>
            <div className={styles.bigValue}>{fmtB(resumen.total2027)} <span style={{ fontSize: 13, color: tokens.colorNeutralForeground3 }}>COP</span></div>
            <span className={styles.pill} style={{ background: GREENLIGHT, color: VERDE }}>
              {(resumen.crecimiento ?? 0) >= 0 ? '↑' : '↓'} {fmtPct(resumen.crecimiento)} vs 2026
            </span>
            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
              <div><div className={styles.miniLabel}>Presupuesto 2026</div><div style={{ fontWeight: 800, color: AZUL_OSCURO }}>{fmtB(resumen.total2026)}</div></div>
              <div><div className={styles.miniLabel}>Desviación en $</div><div style={{ fontWeight: 800, color: VERDE }}>{fmtB(resumen.delta)}</div></div>
            </div>
          </div>

          {/* Evolución 2026 vs 2027, al lado derecho de la tarjeta de presupuesto */}
          <Card className={mergeClasses(styles.chartCard, styles.heroChartCard)}>
            <span className={styles.chartTitle} style={{ fontSize: 14 }}>Evolución presupuesto {filtroZona !== 'Todas' ? `— ${filtroZona}` : ''}</span>
            <span className={styles.chartHint} style={{ marginBottom: 4 }}>Base 2026 vs 2027 (miles de millones COP).</span>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={[{ nombre: '2026', valor: resumen.total2026 }, { nombre: '2027', valor: resumen.total2027 }]} margin={{ top: 18, left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1e9).toFixed(0)}`} tick={{ fontSize: 10 }} width={34} />
                <RTooltip content={<TT />} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={48}>
                  <Cell fill="#9db8d6" /><Cell fill={AZUL} />
                  <LabelList dataKey="valor" content={<BarLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          </div>

          <Card className={mergeClasses(styles.chartCard, styles.heroChartCard)} style={{ marginTop: 10 }}>
            <span className={styles.chartTitle} style={{ fontSize: 14 }}>Líneas operativas {filtroZona !== 'Todas' ? `— ${filtroZona}` : ''}</span>
            <span className={styles.chartHint} style={{ marginBottom: 4 }}>Presupuesto 2027 por línea operativa.</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {R.lineasOrdenadas.map(f => {
                const mayor = R.lineasOrdenadas[0]?.valor || 1;
                const pctBar = (f.valor / mayor) * 100;
                const pctTot = pareto.total ? (f.valor / pareto.total) * 100 : 0;
                return (
                  <div key={f.nombre}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, color: '#323130', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{f.nombre}</span>
                      <span style={{ fontWeight: 700, color: '#003057' }}>{fmtB(f.valor)} <span style={{ color: tokens.colorNeutralForeground3, fontWeight: 500 }}>{pctTot.toFixed(0)}%</span></span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 5 }}>
                      <div style={{ width: `${pctBar}%`, height: '100%', background: AZUL, borderRadius: 5, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Título flotante en la esquina superior derecha del mapa */}
        <div className={styles.heroCaption}>
          <span className={styles.eyebrow}>Presupuesto 2026 vs 2027</span>
          <div className={styles.heroTitle} style={{ margin: '4px 0 6px' }}>Explora por zona</div>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
            Selecciona una zona en el mapa para filtrar y analizar su presupuesto.
          </Caption1>
        </div>
      </div>
      )}

      {/* B. Comparación 2026 vs 2027 (vista 1): mismo mapa + 2 gráficas */}
      {vista === 1 && (
      <div className={styles.heroOverlay}>
        {/* Mapa de fondo, idéntico al del hero */}
        <div className={styles.heroMapBg}>
          <div className={styles.heroMapInner}>
            <ColombiaMapa presupuestoPorZona={R.mapaPorZona} crecimientoPorZona={R.crecimientoPorZona} deltaPorZona={R.deltaPorZona} zonaSel={filtroZona} onSelectZona={setFiltroZona} />
          </div>
        </div>

        {/* Gráficas de comparación a la izquierda */}
        <div className={styles.heroContent}>
          <Card className={mergeClasses(styles.chartCard, styles.heroChartCard)}>
            <span className={styles.chartTitle} style={{ fontSize: 14 }}>Comparación por línea operativa</span>
            <span className={styles.chartHint} style={{ marginBottom: 4 }}>2026 (base) vs 2027 y brecha (Δ), de mayor a menor 2027.</span>
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={[...compLinea].sort((a, b) => b.y2027 - a.y2027).map(c => ({ nombre: c.nombre, '2026': c.y2026, '2027': c.y2027, 'Brecha': c.delta }))}
                layout="vertical" margin={{ left: 4, right: 14 }} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtAxis} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="nombre" width={118} tick={{ fontSize: 9.5 }} interval={0} />
                <RTooltip content={<TT />} />
                <ReferenceLine x={0} stroke="#999" />
                <Bar dataKey="2026" fill="#9db8d6" radius={[0, 3, 3, 0]} barSize={7} />
                <Bar dataKey="2027" fill={AZUL} radius={[0, 3, 3, 0]} barSize={7} />
                <Bar dataKey="Brecha" fill={NARANJA} radius={[0, 3, 3, 0]} barSize={7} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className={mergeClasses(styles.chartCard, styles.heroChartCard)} style={{ marginTop: 10 }}>
            <span className={styles.chartTitle} style={{ fontSize: 14 }}>Mensualización</span>
            <span className={styles.chartHint} style={{ marginBottom: 4 }}>Programar desembolsos y aprobaciones por picos (línea = promedio).</span>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={caja.filas} margin={{ top: 14, left: 4, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} width={68} />
                <RTooltip content={<TT />} />
                <ReferenceLine y={caja.promedio} stroke="#111" strokeDasharray="4 4" />
                <Bar dataKey="valor" name="Caja" radius={[3, 3, 0, 0]}>
                  {caja.filas.map((f, i) => <Cell key={i} fill={f.valor > caja.promedio ? NARANJA : AZUL} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
      )}

      {/* C. Análisis por zona (vista 2): barras horizontales (30%) + mapa de calor (60%) */}
      {vista === 2 && (<>
      <Title3 className={styles.sectionTitle}>Análisis por zona</Title3>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 6fr', gap: 16, alignItems: 'start' }}>
        {/* Planeado por zona (barras horizontales, mayor a menor) */}
        <Card className={styles.chartCard}>
          <span className={styles.chartTitle}>Planeado por zona</span>
          <span className={styles.chartHint}>Presupuesto 2027 por zona, de mayor a menor.</span>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={Object.entries(R.mapaPorZona).sort((a, b) => b[1] - a[1]).map(([nombre, valor]) => ({ nombre, valor }))}
              layout="vertical" margin={{ left: 4, right: 54 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtAxis} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="nombre" width={76} tick={{ fontSize: 11 }} interval={0} />
              <RTooltip content={<TT />} />
              <Bar dataKey="valor" name="Planeado 2027" fill={AZUL} radius={[0, 4, 4, 0]}>
                <LabelList dataKey="valor" position="right" formatter={(v: any) => fmtB(Number(v))} style={{ fontSize: 10, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

      {/* Mapa de calor por zona */}
      <Card className={styles.chartCard}>
        <span className={styles.chartTitle}>Mapa de calor por zona</span>
        <span className={styles.chartHint}>Dónde poner controles de gasto y dueños de presupuesto. Valores en miles de millones (MM).</span>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table} style={{ minWidth: 560 }}>
            <thead>
              <tr><th className={styles.th}>Zona</th>{heat.lineas.map(l => <th key={l} className={styles.th} style={{ textAlign: 'right' }}>{l}</th>)}</tr>
            </thead>
            <tbody>
              {heat.zonas.map(z => (
                <tr key={z}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>{z}</td>
                  {heat.lineas.map(l => {
                    const v = heat.valores[z]?.[l] ?? 0;
                    const intensidad = heat.max > 0 ? v / heat.max : 0;
                    return (
                      <td key={l} className={styles.td} style={{ textAlign: 'right', background: v > 0 ? `rgba(15,95,191,${0.08 + intensidad * 0.7})` : 'transparent', color: intensidad > 0.55 ? '#fff' : '#111', fontWeight: v > 0 ? 600 : 400 }}>
                        {v > 0 ? (v / 1e9).toFixed(1) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
      </>)}

      </div>{/* fin bloque animado por filtros/vista */}

      <div style={{ textAlign: 'center' }}>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
          Valores en COP (MM = miles de millones). 2027 en vivo desde la app; 2026 línea base (Plantilla OPEX).
        </Caption1>
      </div>
    </div>
  );
};

export default ReportesModule;
