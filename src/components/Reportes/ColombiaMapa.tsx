// ============================================================
// ColombiaMapa — mapa de Colombia estilo verde monocromático (diseño AIDesigner).
// Solo los 7 departamentos ancla (uno por zona) son clicables; el seleccionado
// se resalta en verde con marcador pulsante. Etiqueta al pasar el cursor o al
// seleccionar. El resto del país en gris (silueta).
// ============================================================
import React, { useState } from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { DEPARTAMENTOS, ZONA_CIUDAD, MAPA_VIEWBOX } from '../../data/colombiaMapa';
import { fmtB, fmtPct } from '../../utils/reportesAggregations';

const VERDE = '#48946e', VERDE_SUAVE = '#bfe0cf', VERDE_HOVER = '#8fc7ab', GRIS = '#e7edf3';

const useStyles = makeStyles({
  wrap: { position: 'relative', width: '100%' },
  svg: { width: '100%', height: 'auto', display: 'block', overflow: 'visible' },
  depto: { transition: 'fill 0.3s ease, opacity 0.3s ease', stroke: '#ffffff', strokeWidth: 0.8 },
  anchor: { cursor: 'pointer' },
  pulse: {
    transformOrigin: 'center', transformBox: 'fill-box',
    animationName: { '0%,100%': { transform: 'scale(1)', opacity: 0.55 }, '50%': { transform: 'scale(2.4)', opacity: 0 } },
    animationDuration: '2.6s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-out',
  },
  leyenda: { display: 'flex', flexWrap: 'wrap', ...shorthands.gap('4px', '10px'), justifyContent: 'center', marginTop: '6px' },
  chip: {
    display: 'flex', alignItems: 'center', ...shorthands.gap('5px'), fontSize: '11px', cursor: 'pointer',
    ...shorthands.padding('3px', '9px'), borderRadius: '999px', color: tokens.colorNeutralForeground2,
    transition: 'all 0.2s ease',
  },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
});

interface Props {
  presupuestoPorZona: Record<string, number>;
  crecimientoPorZona?: Record<string, number | null>;
  zonaSel: string;
  onSelectZona: (zona: string) => void;
}

export const ColombiaMapa: React.FC<Props> = ({ presupuestoPorZona, crecimientoPorZona, zonaSel, onSelectZona }) => {
  const styles = useStyles();
  const [hover, setHover] = useState<string>('');
  const zonas = Object.keys(ZONA_CIUDAD);
  const toggle = (z: string) => onSelectZona(zonaSel === z ? 'Todas' : z);
  const activa = (z: string) => zonaSel === z || (zonaSel === 'Todas' && hover === z);

  const fillAncla = (z: string) => {
    if (activa(z)) return VERDE;
    if (hover === z) return VERDE_HOVER;
    return VERDE_SUAVE;
  };
  // Zona cuya etiqueta se muestra: la seleccionada, o la que tiene hover.
  const etiquetaZona = zonaSel !== 'Todas' ? zonaSel : hover;

  // Callouts por defecto (estilo tarjetas con línea conectora): todas las zonas
  // a los lados del mapa cuando no hay selección ni hover.
  const CW = 168, CH = 46;
  const callouts = (() => {
    const total = zonas.reduce((s, z) => s + (presupuestoPorZona[z] ?? 0), 0) || 1;
    const items = zonas.map(z => ({ z, ...ZONA_CIUDAD[z], v: presupuestoPorZona[z] ?? 0 }));
    // Tarjeta cerca de su departamento (offset corto desde el punto),
    // hacia el lado con más espacio; de-solape vertical por lado.
    const colocar = (col: typeof items, izquierda: boolean) => {
      let prev = -Infinity;
      return col.sort((a, b) => a.cy - b.cy).map(i => {
        const bx = Math.min(Math.max(izquierda ? i.cx - CW - 55 : i.cx + 55, 4), 760 - CW - 4);
        let by = Math.min(Math.max(i.cy - CH / 2, 6), 903 - CH - 6);
        if (by < prev + CH + 12) by = prev + CH + 12;
        prev = by;
        return { ...i, bx, by, total };
      });
    };
    // Norte va con su tarjeta hacia arriba (cerca del departamento), el resto a los lados.
    const norte = items.filter(i => i.z === 'Norte').map(i => ({
      ...i,
      bx: Math.min(Math.max(i.cx - CW / 2, 4), 760 - CW - 4),
      by: Math.max(i.cy - CH - 42, 6),
      total,
    }));
    const resto = items.filter(i => i.z !== 'Norte');
    return [
      ...norte,
      ...colocar(resto.filter(i => i.cx < 380), true),
      ...colocar(resto.filter(i => i.cx >= 380), false),
    ];
  })();

  return (
    <div className={styles.wrap}>
      <svg viewBox={MAPA_VIEWBOX} className={styles.svg} role="img" aria-label="Mapa de zonas por departamento">
        {/* Silueta (departamentos sin zona) en gris */}
        {DEPARTAMENTOS.filter(d => !d.zona).map(d => (
          <path key={d.code} d={d.path} className={styles.depto} fill={GRIS} opacity={0.85}><title>{d.nombre}</title></path>
        ))}
        {/* Departamentos ancla (verde monocromático, clicables) */}
        {DEPARTAMENTOS.filter(d => d.zona).map(d => (
          <path key={d.code} d={d.path} className={`${styles.depto} ${styles.anchor}`}
            fill={fillAncla(d.zona)} opacity={zonaSel !== 'Todas' && zonaSel !== d.zona ? 0.55 : 1}
            style={{ filter: activa(d.zona) ? 'drop-shadow(0 3px 8px rgba(72,148,110,0.4))' : undefined }}
            onClick={() => toggle(d.zona)} onMouseEnter={() => setHover(d.zona)} onMouseLeave={() => setHover('')}>
            <title>{d.zona} ({d.nombre}): {fmtB(presupuestoPorZona[d.zona] ?? 0)}</title>
          </path>
        ))}
        {/* Marcadores en cada ancla; pulso en la activa */}
        {zonas.map(z => {
          const c = ZONA_CIUDAD[z];
          const act = activa(z);
          return (
            <g key={z} onClick={() => toggle(z)} onMouseEnter={() => setHover(z)} onMouseLeave={() => setHover('')} style={{ cursor: 'pointer' }}>
              {act && <circle cx={c.cx} cy={c.cy} r={7} fill={VERDE} className={styles.pulse} />}
              <circle cx={c.cx} cy={c.cy} r={5} fill="#fff" stroke={VERDE} strokeWidth={act ? 2.5 : 1.5} />
              <circle cx={c.cx} cy={c.cy} r={2} fill={VERDE} />
            </g>
          );
        })}
        {/* Callouts de todas las zonas (vista por defecto, sin selección ni hover) */}
        {zonaSel === 'Todas' && !hover && callouts.map(c => (
          <g key={c.z} style={{ pointerEvents: 'none' }}>
            <line
              x1={c.by + CH < c.cy ? c.cx : (c.bx < c.cx ? c.bx + CW : c.bx)}
              y1={c.by + CH < c.cy ? c.by + CH : c.by + CH / 2}
              x2={c.cx} y2={c.cy} stroke="#9fb3c8" strokeWidth={1.3} />
            <circle cx={c.cx} cy={c.cy} r={3} fill={VERDE} />
            <rect x={c.bx} y={c.by} width={CW} height={CH} rx={10} fill="rgba(255,255,255,0.95)"
              stroke="rgba(0,0,0,0.07)" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.08))" />
            <text x={c.bx + 12} y={c.by + 18} fontSize={11} fontWeight={700} fill={VERDE} letterSpacing="0.5">{c.z.toUpperCase()}</text>
            <text x={c.bx + 12} y={c.by + 37} fontSize={14.5} fontWeight={800} fill="#112240">{fmtB(c.v)}</text>
            <text x={c.bx + CW - 12} y={c.by + 37} fontSize={11} fontWeight={700} fill="#64748b" textAnchor="end">{((c.v / c.total) * 100).toFixed(0)}%</text>
          </g>
        ))}

        {/* Etiqueta flotante de la zona activa (seleccionada u hover) */}
        {etiquetaZona && ZONA_CIUDAD[etiquetaZona] && (() => {
          const c = ZONA_CIUDAD[etiquetaZona]; const w = 150, h = 52;
          const der = c.cx < 560; const bx = der ? c.cx + 12 : c.cx - w - 12; const by = c.cy - h - 8;
          const crec = crecimientoPorZona?.[etiquetaZona];
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={bx} y={by} width={w} height={h} rx={11} fill="#fff" stroke="rgba(0,0,0,0.06)"
                filter="drop-shadow(0 10px 24px rgba(0,0,0,0.14))" />
              <circle cx={bx + 13} cy={by + 15} r={3} fill={VERDE} />
              <text x={bx + 22} y={by + 18} fontSize={10} fontWeight={700} fill="#112240" letterSpacing="0.5">{etiquetaZona.toUpperCase()}</text>
              <text x={bx + 12} y={by + 36} fontSize={17} fontWeight={800} fill="#112240">{fmtB(presupuestoPorZona[etiquetaZona] ?? 0)}</text>
              {crec != null && <text x={bx + w - 12} y={by + 36} fontSize={11} fontWeight={700} fill={crec >= 0 ? VERDE : '#d64545'} textAnchor="end">{fmtPct(crec)}</text>}
            </g>
          );
        })()}
      </svg>

      <div className={styles.leyenda}>
        {zonas.map(z => (
          <span key={z} className={styles.chip} onClick={() => toggle(z)}
            style={{ fontWeight: zonaSel === z ? 700 : 400, background: zonaSel === z ? '#ebf6f0' : undefined, color: zonaSel === z ? VERDE : undefined }}>
            <span className={styles.dot} style={{ background: zonaSel === z ? VERDE : VERDE_SUAVE }} /> {z}
          </span>
        ))}
      </div>
    </div>
  );
};
