// ============================================================
// ColombiaMapa — mapa de Colombia; solo los 7 departamentos ancla (uno por zona)
// están coloreados y son clicables para filtrar. El resto queda en gris.
// ============================================================
import React, { useState } from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { DEPARTAMENTOS, ZONA_CIUDAD, MAPA_VIEWBOX } from '../../data/colombiaMapa';
import { fmtB } from '../../utils/reportesAggregations';

export const ZONA_COLOR: Record<string, string> = {
  Occidente: '#2f6fb0', Centro: '#e08a1e', Oriente: '#d64545', Norte: '#2b9c8f',
  CLC: '#b07d33', Coveñas: '#7a52c9', Llanos: '#3f9b52', Transversal: '#8a94a6', '': '#dbe3ec',
};
const GRIS = '#e6ebf1';

const useStyles = makeStyles({
  wrap: { position: 'relative', width: '100%' },
  svg: { width: '100%', height: 'auto', display: 'block' },
  depto: { transition: 'opacity 0.3s ease, filter 0.2s ease', stroke: '#ffffff', strokeWidth: 0.8 },
  anchor: { cursor: 'pointer', ':hover': { filter: 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))' } },
  leyenda: { display: 'flex', flexWrap: 'wrap', ...shorthands.gap('6px', '12px'), justifyContent: 'center', marginTop: '8px' },
  leyendaItem: { display: 'flex', alignItems: 'center', ...shorthands.gap('6px'), fontSize: '11.5px', color: tokens.colorNeutralForeground2, cursor: 'pointer', ...shorthands.padding('2px', '6px'), borderRadius: '6px' },
  swatch: { width: '11px', height: '11px', borderRadius: '3px' },
});

interface Props {
  presupuestoPorZona: Record<string, number>;
  zonaSel: string;
  onSelectZona: (zona: string) => void;
}

export const ColombiaMapa: React.FC<Props> = ({ presupuestoPorZona, zonaSel, onSelectZona }) => {
  const styles = useStyles();
  const [hover, setHover] = useState<string>('');
  const zonas = Object.keys(ZONA_CIUDAD);
  const toggle = (z: string) => onSelectZona(zonaSel === z ? 'Todas' : z);

  const opacidadAncla = (z: string) => {
    if (zonaSel !== 'Todas' && zonaSel !== z) return 0.3;
    if (hover && hover !== z) return 0.75;
    return 1;
  };

  return (
    <div className={styles.wrap}>
      <svg viewBox={MAPA_VIEWBOX} className={styles.svg} role="img" aria-label="Mapa de zonas por departamento">
        {/* Departamentos sin zona: gris de fondo (silueta de Colombia) */}
        {DEPARTAMENTOS.filter(d => !d.zona).map(d => (
          <path key={d.code} d={d.path} className={styles.depto} fill={GRIS} opacity={0.9}>
            <title>{d.nombre}</title>
          </path>
        ))}
        {/* Departamentos ancla (coloreados, clicables) */}
        {DEPARTAMENTOS.filter(d => d.zona).map(d => (
          <path key={d.code} d={d.path} className={`${styles.depto} ${styles.anchor}`}
            fill={ZONA_COLOR[d.zona]} opacity={opacidadAncla(d.zona)}
            onClick={() => toggle(d.zona)}
            onMouseEnter={() => setHover(d.zona)} onMouseLeave={() => setHover('')}>
            <title>{d.zona} ({d.nombre}): {fmtB(presupuestoPorZona[d.zona] ?? 0)}</title>
          </path>
        ))}
        {/* Etiquetas de presupuesto por zona */}
        {zonas.map(z => {
          const c = ZONA_CIUDAD[z];
          const activo = zonaSel === 'Todas' || zonaSel === z;
          const w = 118, h = 36;
          const derecha = c.cx < 560;
          const bx = derecha ? c.cx + 7 : c.cx - w - 7;
          return (
            <g key={z} opacity={activo ? 1 : 0.35} style={{ transition: 'opacity 0.3s ease', cursor: 'pointer' }}
              onClick={() => toggle(z)} onMouseEnter={() => setHover(z)} onMouseLeave={() => setHover('')}>
              <circle cx={c.cx} cy={c.cy} r={4.5} fill={ZONA_COLOR[z]} stroke="#fff" strokeWidth={1.5} />
              <rect x={bx} y={c.cy - h / 2} width={w} height={h} rx={8} fill="#fff" stroke={ZONA_COLOR[z]} strokeWidth={zonaSel === z ? 2 : 1.2}
                filter="drop-shadow(0 2px 5px rgba(0,0,0,0.12))" />
              <text x={bx + 10} y={c.cy - 4} fontSize={10.5} fontWeight={700} fill={ZONA_COLOR[z]}>{z}</text>
              <text x={bx + 10} y={c.cy + 11} fontSize={11.5} fontWeight={800} fill="#003057">{fmtB(presupuestoPorZona[z] ?? 0)}</text>
            </g>
          );
        })}
      </svg>

      <div className={styles.leyenda}>
        {zonas.map(z => (
          <span key={z} className={styles.leyendaItem} onClick={() => toggle(z)}
            style={{ fontWeight: zonaSel === z ? 700 : 400, background: zonaSel === z ? `${ZONA_COLOR[z]}18` : undefined, color: zonaSel === z ? ZONA_COLOR[z] : undefined }}>
            <span className={styles.swatch} style={{ background: ZONA_COLOR[z] }} /> {z} · {ZONA_CIUDAD[z].depto}
          </span>
        ))}
      </div>
    </div>
  );
};
