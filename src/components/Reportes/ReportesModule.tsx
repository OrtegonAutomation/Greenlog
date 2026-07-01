import React, { useMemo } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title2, Title3, Body1, Caption1, Card, Button, Spinner,
} from '@fluentui/react-components';
import { ArrowTrendingLinesRegular, DataBarVerticalRegular } from '@fluentui/react-icons';
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
} from '../../utils/reportesAggregations';
import { exportReporteToExcel } from '../../utils/exportReporte';

const AZUL = '#0f5fbf', NARANJA = '#c05a1e', VERDE = '#1f7a3d', ROJO = '#e02424', MORADO = '#5b3fd6';

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

const fmtAxis = (v: number) => `$${(v / 1e9).toFixed(1)}B`;
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

  const R = useMemo(() => {
    const acts = actividadesAnio(actividades, 2027);
    const resumen = resumenComparacion(acts);
    const compZona = comparacionPorZona(acts);
    const compLinea = comparacionPorLinea(acts);
    const pareto = paretoLineas(acts);
    const caja = cajaMensual(acts);
    const proveedores = dependenciaProveedores(acts);
    const exposicion = exposicionPorLinea(acts);
    const heat = heatmapZonaLinea(acts);
    const conc = concentracionTop(acts, 3);
    return { acts, resumen, compZona, compLinea, pareto, caja, proveedores, exposicion, heat, conc };
  }, [actividades]);

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
      <Button appearance="subtle" icon={<ArrowTrendingLinesRegular />}
        disabled={cargando || R.acts.length === 0}
        onClick={() => exportReporteToExcel(actividades, 2027)}>
        Exportar Informe
      </Button>
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

      {/* A. KPIs */}
      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}><span className={styles.kpiLabel}>Presupuesto 2027</span><span className={styles.kpiValue}>{fmtB(resumen.total2027)}</span><span className={styles.kpiSub}>COP</span></Card>
        <Card className={styles.kpiCard}><span className={styles.kpiLabel}>Base 2026</span><span className={styles.kpiValue}>{fmtB(resumen.total2026)}</span><span className={styles.kpiSub}>Línea base</span></Card>
        <Card className={styles.kpiCard}><span className={styles.kpiLabel}>Crecimiento vs 2026</span><span className={styles.kpiValue} style={{ color: VERDE }}>{fmtPct(resumen.crecimiento)}</span><span className={styles.kpiSub}>Δ {fmtB(resumen.delta)}</span></Card>
        <Card className={styles.kpiCard}><span className={styles.kpiLabel}>Concentración top 3 rubros</span><span className={styles.kpiValue}>{conc.toFixed(0)}%</span><span className={styles.kpiSub}>prioridad de control</span></Card>
        <Card className={styles.kpiCard}><span className={styles.kpiLabel}>Mayor mes de caja</span><span className={styles.kpiValue}>{caja.picoMes}</span><span className={styles.kpiSub}>{fmtB(caja.picoValor)}</span></Card>
      </div>

      {/* B. Comparación 2026 vs 2027 */}
      <Title3 className={styles.sectionTitle}>Comparación 2026 vs 2027</Title3>
      <div className={styles.grid2}>
        {/* B1. Brecha por zona */}
        <Card className={styles.chartCard}>
          <span className={styles.chartTitle}>1. Brecha presupuestal por zona</span>
          <span className={styles.chartHint}>Δ 2027 − 2026 por zona. Verde = disminuye, naranja = aumenta.</span>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compZona.map(c => ({ nombre: c.nombre, delta: c.delta }))} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nombre" width={78} tick={{ fontSize: 11 }} />
              <RTooltip content={<TT />} />
              <ReferenceLine x={0} stroke="#999" />
              <Bar dataKey="delta" name="Δ vs 2026" radius={[0, 4, 4, 0]}>
                {compZona.map((c, i) => <Cell key={i} fill={c.delta >= 0 ? NARANJA : VERDE} />)}
                <LabelList dataKey="delta" position="right" formatter={(v: any) => fmtB(Number(v))} style={{ fontSize: 10, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* B2. Comparación por línea */}
        <Card className={styles.chartCard}>
          <span className={styles.chartTitle}>2. Comparación por línea operativa</span>
          <span className={styles.chartHint}>Presupuesto por rubro: 2026 (base) vs 2027.</span>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compLinea.map(c => ({ nombre: c.nombre, '2026': c.y2026, '2027': c.y2027 }))} margin={{ left: 4, right: 10, bottom: 46 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 9.5 }} height={60} />
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
              <RTooltip content={<TT />} />
              <Bar dataKey="2026" fill="#9db8d6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="2027" fill={AZUL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* B3. Variación % (tabla) */}
      <Card className={styles.chartCard}>
        <span className={styles.chartTitle}>3. Variación por zona (drivers de crecimiento)</span>
        <span className={styles.chartHint}>Dónde revisar incrementos y sustentar frente al año base.</span>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead><tr><th className={styles.th}>Zona</th><th className={styles.th}>2026</th><th className={styles.th}>2027</th><th className={styles.th}>Δ</th><th className={styles.th}>Var %</th></tr></thead>
            <tbody>
              {compZona.map(c => (
                <tr key={c.nombre}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>{c.nombre}</td>
                  <td className={styles.td}>{fmtB(c.y2026)}</td>
                  <td className={styles.td}>{fmtB(c.y2027)}</td>
                  <td className={styles.td} style={{ color: c.delta >= 0 ? NARANJA : VERDE, fontWeight: 700 }}>{fmtB(c.delta)}</td>
                  <td className={styles.td} style={{ color: (c.varPct ?? 0) >= 0 ? NARANJA : VERDE, fontWeight: 700 }}>{fmtPct(c.varPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* C. Composición y control 2027 */}
      <Title3 className={styles.sectionTitle}>Composición y control del OPEX 2027</Title3>
      <div className={styles.grid2}>
        {/* C1. Pareto */}
        <Card className={styles.chartCard}>
          <span className={styles.chartTitle}>4. Pareto de rubros controlables</span>
          <span className={styles.chartHint}>Dónde negociar, limitar alcance o blindar presupuesto (línea = acumulado %).</span>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={pareto.filas.map(f => ({ nombre: f.nombre, valor: f.valor, acum: f.acumPct }))} margin={{ left: 4, right: 10, bottom: 46 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 9.5 }} height={60} />
              <YAxis yAxisId="l" tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
              <RTooltip content={<TT />} />
              <Bar yAxisId="l" dataKey="valor" name="Presupuesto" fill={AZUL} radius={[3, 3, 0, 0]} />
              <Line yAxisId="r" dataKey="acum" name="Acumulado %" stroke="#111" strokeWidth={2} dot={{ r: 3 }} />
              <ReferenceLine yAxisId="r" y={80} stroke={ROJO} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* C2. Caja mensual */}
        <Card className={styles.chartCard}>
          <span className={styles.chartTitle}>5. Presión mensual de caja</span>
          <span className={styles.chartHint}>Programar desembolsos y aprobaciones por picos (línea = promedio).</span>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={caja.filas} margin={{ left: 4, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
              <RTooltip content={<TT />} />
              <ReferenceLine y={caja.promedio} stroke="#111" strokeDasharray="4 4" />
              <Bar dataKey="valor" name="Caja" radius={[3, 3, 0, 0]}>
                {caja.filas.map((f, i) => <Cell key={i} fill={f.valor > caja.promedio ? NARANJA : AZUL} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className={styles.grid2}>
        {/* C3. Exposición contractual */}
        <Card className={styles.chartCard}>
          <span className={styles.chartTitle}>6. Exposición por definir o cerrar</span>
          <span className={styles.chartHint}>Rojo = presupuesto sin contrato definido (riesgo contractual). Total por definir: {fmtB(exposicion.totalPorDefinir)}.</span>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={exposicion.filas} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="linea" width={110} tick={{ fontSize: 10 }} />
              <RTooltip content={<TT />} />
              <Bar dataKey="base" name="Base ejecutable" stackId="a" fill="#8fbce8" radius={[0, 0, 0, 0]} />
              <Bar dataKey="porDefinir" name="Por definir / cerrar" stackId="a" fill={ROJO} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* C4. Dependencia de proveedores */}
        <Card className={styles.chartCard}>
          <span className={styles.chartTitle}>7. Dependencia de proveedores</span>
          <span className={styles.chartHint}>Identificar concentración para negociación y continuidad.</span>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={proveedores.map(p => ({ nombre: p.nombre.length > 22 ? p.nombre.slice(0, 22) + '…' : p.nombre, valor: p.valor, pct: p.pct }))} layout="vertical" margin={{ left: 10, right: 44 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nombre" width={130} tick={{ fontSize: 9.5 }} />
              <RTooltip content={<TT />} />
              <Bar dataKey="valor" name="Monto" fill={MORADO} radius={[0, 4, 4, 0]}>
                <LabelList dataKey="pct" position="right" formatter={(v: any) => `${Number(v).toFixed(0)}%`} style={{ fontSize: 10, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* C5. Heatmap Zona × Rubro */}
      <Card className={styles.chartCard}>
        <span className={styles.chartTitle}>8. Concentración Zona × Rubro (2027)</span>
        <span className={styles.chartHint}>Dónde poner controles de gasto y dueños de presupuesto. Valores en miles de millones (B).</span>
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

      {/* D. Mapa de decisiones */}
      <Title3 className={styles.sectionTitle}>Mapa de decisiones financieras sugeridas</Title3>
      <Card className={styles.chartCard}>
        <span className={styles.chartHint}>Guion para comité: qué decisión tomar, con qué indicador y qué acción seguir.</span>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead><tr><th className={styles.th}>Decisión</th><th className={styles.th}>Indicador que la dispara</th><th className={styles.th}>Acción sugerida</th><th className={styles.th}>Responsable</th></tr></thead>
            <tbody>
              <tr><td className={styles.td}>Revisar incremento</td><td className={styles.td}>{zonaMayor?.nombre}: {fmtB(zonaMayor?.delta ?? 0)} vs 2026</td><td className={styles.td}>Sustentar drivers y validar reserva.</td><td className={styles.td}>Finanzas + dueño de zona</td></tr>
              <tr><td className={styles.td}>Controlar rubro dominante</td><td className={styles.td}>{rubroDominante?.nombre}: {fmtB(rubroDominante?.valor ?? 0)} ({((rubroDominante?.valor ?? 0) / (pareto.total || 1) * 100).toFixed(0)}%)</td><td className={styles.td}>Negociar alcance y definir techo de ejecución.</td><td className={styles.td}>Finanzas + área técnica</td></tr>
              <tr><td className={styles.td}>Asegurar caja</td><td className={styles.td}>{caja.picoMes}: {fmtB(caja.picoValor)} (pico mensual)</td><td className={styles.td}>Programar aprobaciones antes del pico.</td><td className={styles.td}>Tesorería + planeación</td></tr>
              <tr><td className={styles.td}>Cerrar riesgo contractual</td><td className={styles.td}>Por definir/cerrar: {fmtB(exposicion.totalPorDefinir)}</td><td className={styles.td}>Asignar fecha de cierre y ruta de abastecimiento.</td><td className={styles.td}>Abastecimiento + contrato</td></tr>
              <tr><td className={styles.td}>Gestionar concentración</td><td className={styles.td}>{proveedores[0]?.nombre}: {proveedores[0] ? proveedores[0].pct.toFixed(0) : 0}% del gasto</td><td className={styles.td}>Evaluar dependencia y alternativas comerciales.</td><td className={styles.td}>Abastecimiento</td></tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ textAlign: 'center' }}>
        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Valores en COP. 2027 en vivo desde la app; 2026 línea base (Plantilla OPEX).</Caption1>
      </div>
    </div>
  );
};

export default ReportesModule;
