// ============================================================
// ColombiaMapa — mapa de Colombia por departamentos, coloreado por zona CENIT.
// Clic en una zona filtra el reporte; muestra el presupuesto por zona.
// ============================================================
import React, { useState } from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { DEPARTAMENTOS, ZONA_CIUDAD, MAPA_VIEWBOX } from '../../data/colombiaMapa';
import { fmtB } from '../../utils/reportesAggregations';

export const ZONA_COLOR: Record<string, string> = {
  Occidente: '#2f6fb0', Centro: '#e08a1e', Oriente: '#d64545', Norte: '#2b9c8f',
  CLC: '#b07d33', Coveñas: '#7a52c9', Llanos: '#3f9b52', Transversal: '#8a94a6', '': '#c9d3de',
};

const useStyles = makeStyles({
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' },
  svg: { width: '100%', height: 'auto', maxHeight: '520px', display: 'block' },
  depto: {
    cursor: 'pointer',
    transition: 'opacity 0.25s ease, filter 0.2s ease',
    stroke: '#ffffff', strokeWidth: 1,
    ':hover': { filter: 'brightness(1.12)' },
  },
  pinCard: { pointerEvents: 'none' },
  leyenda: { display: 'flex', flexWrap: 'wrap', ...shorthands.gap('6px', '14px'), justifyContent: 'center', marginTop: '10px' },
  leyendaItem: { display: 'flex', alignItems: 'center', ...shorthands.gap('6px'), fontSize: '11.5px', color: tokens.colorNeutralForeground2, cursor: 'pointer' },
  swatch: { width: '12px', height: '12px', borderRadius: '3px' },
});

interface Props {
  presupuestoPorZona: Record<string, number>;
  zonaSel: string; // 'Todas' o una zona
  onSelectZona: (zona: string) => void;
}

export const ColombiaMapa: React.FC<Props> = ({ presupuestoPorZona, zonaSel, onSelectZona }) => {
  const styles = useStyles();
  const [hover, setHover] = useState<string>('');
  const zonasConDatos = Object.keys(ZONA_CIUDAD);

  const toggle = (zona: string) => onSelectZona(zonaSel === zona ? 'Todas' : zona);

  const opacidad = (zona: string) => {
    if (!zona) return 0.35;
    if (zonaSel !== 'Todas' && zonaSel !== zona) return 0.28;
    if (hover && hover !== zona) return 0.7;
    return 1;
  };

  return (
    <div className={styles.wrap}>
      <svg viewBox={MAPA_VIEWBOX} className={styles.svg} role="img" aria-label="Mapa de zonas por departamento">
        {DEPARTAMENTOS.map(dep => (
          <path
            key={dep.code}
            d={dep.path}
            className={styles.depto}
            fill={ZONA_COLOR[dep.zona] ?? ZONA_COLOR['']}
            opacity={opacidad(dep.zona)}
            onClick={() => dep.zona && toggle(dep.zona)}
            onMouseEnter={() => setHover(dep.zona)}
            onMouseLeave={() => setHover('')}
          >
            <title>{dep.nombre}{dep.zona ? ` · ${dep.zona}: ${fmtB(presupuestoPorZona[dep.zona] ?? 0)}` : ''}</title>
          </path>
        ))}

        {/* Pines de presupuesto por zona */}
        {zonasConDatos.map(zona => {
          const c = ZONA_CIUDAD[zona];
          const activo = zonaSel === 'Todas' || zonaSel === zona;
          const w = 120, h = 34;
          return (
            <g key={zona} className={styles.pinCard} opacity={activo ? 1 : 0.35} style={{ transition: 'opacity 0.25s ease' }}>
              <circle cx={c.cx} cy={c.cy} r={4} fill="#111" />
              <rect x={c.cx + 6} y={c.cy - h / 2} width={w} height={h} rx={7} fill="#fff" stroke={ZONA_COLOR[zona]} strokeWidth={1.5} />
              <text x={c.cx + 14} y={c.cy - 4} fontSize={11} fontWeight={700} fill={ZONA_COLOR[zona]}>{zona}</text>
              <text x={c.cx + 14} y={c.cy + 10} fontSize={11} fontWeight={700} fill="#003057">{fmtB(presupuestoPorZona[zona] ?? 0)}</text>
            </g>
          );
        })}
      </svg>

      <div className={styles.leyenda}>
        {zonasConDatos.map(z => (
          <span key={z} className={styles.leyendaItem} onClick={() => toggle(z)}
            style={{ fontWeight: zonaSel === z ? 700 : 400, color: zonaSel === z ? ZONA_COLOR[z] : undefined }}>
            <span className={styles.swatch} style={{ background: ZONA_COLOR[z] }} /> {z}
          </span>
        ))}
      </div>
    </div>
  );
};
