import React, { useMemo, useState } from 'react';
import {
  makeStyles, shorthands, tokens,
  Title1, Title3, Body1, Caption1,
  Button,
} from '@fluentui/react-components';
import {
  ArrowRight24Regular,
  ArrowLeft16Regular,
} from '@fluentui/react-icons';
import { useActividades } from '../../hooks/useActividades';
import { useAuth } from '../../auth/AuthContext';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import { StatCard } from '../common/StatCard';
import { FeatureCard } from '../common/FeatureCard';
import { SeccionApp } from '../../types';
import { actividadesAnio, total2027, fmtB, fmtPct } from '../../utils/reportesAggregations';
import { TOTAL_2026 } from '../../data/baseline2026';
import { MEDIA } from '../../hooks/useResponsive';

// ── Estilos ───────────────────────────────────────────────────
const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('40px'),
    [MEDIA.mobile]: { ...shorthands.gap('24px') },
    animationName: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    animationDuration: '0.4s',
    animationFillMode: 'both',
  },

  // Hero Section
  hero: {
    position: 'relative',
    borderRadius: '24px',
    overflow: 'hidden',
    minHeight: '380px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    ...shorthands.padding('60px'),
    color: 'white',
    background: CENIT_COLORS.heroGradient,
    boxShadow: '0 20px 40px -10px rgba(0, 51, 160, 0.3)',
    [MEDIA.mobile]: {
      ...shorthands.padding('24px', '20px'),
      minHeight: '240px',
      borderRadius: '18px',
    },
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '800',
    lineHeight: '1.1',
    letterSpacing: '-1px',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    [MEDIA.mobile]: { fontSize: '26px', letterSpacing: '-0.5px' },
  },
  heroSubtitle: {
    fontSize: '18px',
    [MEDIA.mobile]: { fontSize: '14px' },
    opacity: 0.9,
    lineHeight: '1.5',
    fontWeight: '500',
  },
  heroButton: {
    width: 'fit-content',
    marginTop: '10px',
    backgroundColor: CENIT_COLORS.green,
    color: '#0033A0',
    fontWeight: '700',
    fontSize: '16px',
    padding: '12px 24px',
    borderRadius: '30px',
    border: 'none',
    ':hover': {
      backgroundColor: CENIT_COLORS.greenMid,
      color: 'white',
    },
  },
  heroDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '60%',
    background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 60%)',
    zIndex: 1,
  },

  // Stats Section
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    [MEDIA.mobile]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
    },
  },

  // Modules Section
  modulesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: CENIT_COLORS.blueBrand,
    marginBottom: '8px',
    [MEDIA.mobile]: { fontSize: '19px', marginBottom: '0px' },
  },
  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    [MEDIA.mobile]: { gridTemplateColumns: '1fr', gap: '14px' },
    animationName: {
      from: { opacity: '0', transform: 'translateY(12px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.35s',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  backButton: {
    borderRadius: '20px',
    fontWeight: '600',
  },

  // Footer / Certifications
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    paddingTop: '40px',
    paddingBottom: '20px',
    opacity: 0.7,
  },
  certRow: {
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  certPlaceholder: {
    height: '40px',
    background: '#ccc',
    borderRadius: '4px',
    opacity: 0.5,
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
  }

});

interface DashboardProps {
  onNavigate: (section: SeccionApp) => void;
}

// ── Componente ────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const styles = useStyles();
  const { actividades } = useActividades();
  const { currentUser, isAdmin } = useAuth();
  const esVisor = !!currentUser?.visor && !isAdmin;
  // Sección expandida en "Nuestros Módulos" (null = vista de secciones)
  const [seccionAbierta, setSeccionAbierta] = useState<'presupuestal' | 'eventos' | null>(null);

  // KPIs con datos reales de la planeación 2027 (misma fuente que Reportes).
  const stats = useMemo(() => {
    const acts = actividadesAnio(actividades, 2027);
    const presupuesto2027 = total2027(acts);
    const crecimiento = TOTAL_2026 > 0 ? (presupuesto2027 - TOTAL_2026) / TOTAL_2026 : null;
    const zonas = new Set(acts.map(a => a.zona).filter(Boolean)).size;
    const estaciones = new Set(acts.map(a => a.estacion).filter(Boolean)).size;
    const lineas = new Set(acts.map(a => a.lineaOperativa).filter(Boolean)).size;
    return { total: acts.length, presupuesto2027, crecimiento, zonas, estaciones, lineas };
  }, [actividades]);

  return (
    <div className={styles.root}>

      {/* Hero */}
      {/* Hero */}
      <div
        className={styles.hero}
        id="dashboard-hero"
        style={{
          background: `linear-gradient(90deg, rgba(0,34,102,0.9) 0%, rgba(0,51,160,0.7) 45%, rgba(0,0,0,0.1) 100%), url('https://cenit-transporte.com/wp-content/uploads/2025/10/geodesicos1.jpg') no-repeat center center`,
          backgroundSize: 'cover',
        }}
      >
        <div className={styles.heroContent}>
          <div style={{ marginBottom: '16px' }}>
            <img
              src="https://cenit-transporte.com/wp-content/uploads/2025/10/cobranding-en-blanco.png"
              alt="Cenit Grupo Ecopetrol"
              style={{ height: '48px', objectFit: 'contain' }}
            />
          </div>
          <Title1 className={styles.heroTitle}>Talento que mueve al país</Title1>
          <Body1 className={styles.heroSubtitle}>
            Gestiona, planifica y ejecuta las actividades de control ambiental con la energía que nos une.
          </Body1>
          <Button
            className={styles.heroButton}
            icon={<ArrowRight24Regular />}
            iconPosition="after"
            onClick={() => onNavigate(esVisor ? 'reportes' : 'planeacion')}
          >
            {esVisor ? 'Ir a Reportes' : 'Ir a Planeación'}
          </Button>
        </div>
      </div>

      {/* Stats Bar - Información útil de la app */}
      <div className={styles.statsRow} id="dashboard-kpis">
        <StatCard
          value={stats.total.toString()}
          label="Actividades planeadas"
          sub="Actividades ambientales de la planeación 2027"
        />
        <StatCard
          value={fmtB(stats.presupuesto2027)}
          label="Presupuesto 2027"
          sub={`OPEX planeado en ${stats.lineas} líneas operativas`}
        />
        <StatCard
          value={fmtPct(stats.crecimiento)}
          label="Variación vs 2026"
          sub={`Frente a la línea base 2026 (${fmtB(TOTAL_2026)})`}
        />
        <StatCard
          value={`${stats.estaciones}`}
          label="Cobertura"
          sub={`Estaciones y lugares con actividad en ${stats.zonas} zonas`}
        />
      </div>

      {/* Modules Grid: dos secciones (Planeación Presupuestal / Eventos
          Ambientales) que al hacer click se expanden a sus módulos */}
      <div className={styles.modulesSection}>
        <div className={styles.sectionTitleRow}>
          {seccionAbierta !== null && (
            <Button
              className={styles.backButton}
              appearance="outline"
              icon={<ArrowLeft16Regular />}
              onClick={() => setSeccionAbierta(null)}
            >
              Volver
            </Button>
          )}
          <Title1 className={styles.sectionTitle}>
            {seccionAbierta === 'presupuestal' ? 'Planeación Presupuestal'
              : seccionAbierta === 'eventos' ? 'Eventos Ambientales'
              : 'Nuestros Módulos'}
          </Title1>
        </div>

        {seccionAbierta === null && (
          <div className={styles.modulesGrid} key="secciones">
            <FeatureCard
              title="Planeación Presupuestal"
              description="Planeación, ejecución y reportes del presupuesto ambiental."
              actionLabel="Ver módulos"
              imageUrl="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2626&auto=format&fit=crop"
              gradient="linear-gradient(135deg, #16a34a 0%, #059669 100%)"
              onClick={() => setSeccionAbierta('presupuestal')}
            />
            <FeatureCard
              title="Eventos Ambientales"
              description="Gestión de aguas, residuos y contingencias ambientales."
              actionLabel="Ver módulos"
              imageUrl="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=2670&auto=format&fit=crop"
              gradient="linear-gradient(135deg, #0d9488 0%, #0e7490 100%)"
              onClick={() => setSeccionAbierta('eventos')}
            />
            {isAdmin && (
              <FeatureCard
                title="Administración"
                description="Congela la matriz financiera y gestiona usuarios, roles y permisos por zona."
                actionLabel="Ver Administración"
                imageUrl="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2670&auto=format&fit=crop"
                gradient="linear-gradient(135deg, #5b3fd6 0%, #3b2a8f 100%)"
                onClick={() => onNavigate('administracion')}
              />
            )}
          </div>
        )}

        {seccionAbierta === 'presupuestal' && (
          <div className={styles.modulesGrid} key="presupuestal">
            {(!esVisor || currentUser?.verPlaneacion) && (
              <FeatureCard
                title="Planeación Ambiental"
                description="Gestiona y programa las actividades de mantenimiento y control ambiental."
                actionLabel="Ver Planeación"
                imageUrl="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2626&auto=format&fit=crop"
                gradient="linear-gradient(135deg, #16a34a 0%, #059669 100%)"
                onClick={() => onNavigate('planeacion')}
              />
            )}
            {isAdmin && (
              <FeatureCard
                title="Ejecución y Seguimiento"
                description="Monitoreo en tiempo real del avance en campo y cumplimiento de metas."
                actionLabel="Ver Ejecución"
                imageUrl="https://sinnaps.com/wp-content/uploads/2017/09/dc1pt-pxsaqkcn_.jpg-large.jpg"
                gradient="linear-gradient(135deg, #0056D2 0%, #0033A0 100%)"
                onClick={() => onNavigate('ejecucion')}
              />
            )}
            <FeatureCard
              title="Reportes e Indicadores"
              description="Análisis detallado de KPIs, cumplimiento normativo y estadísticas."
              actionLabel="Ver Reportes"
              imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop"
              gradient="linear-gradient(135deg, #002266 0%, #172554 100%)"
              onClick={() => onNavigate('reportes')}
            />
          </div>
        )}

        {seccionAbierta === 'eventos' && (
          <div className={styles.modulesGrid} key="eventos">
            <FeatureCard
              title="Aguas"
              description="Captación, tratamiento, monitoreo y vertimiento de aguas."
              imageUrl="https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=2670&auto=format&fit=crop"
              gradient="linear-gradient(135deg, #0891b2 0%, #155e75 100%)"
              disabled
              badge="Próximamente"
            />
            <FeatureCard
              title="Residuos"
              description="Clasificación, almacenamiento, tratamiento y disposición final de residuos."
              imageUrl="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2670&auto=format&fit=crop"
              gradient="linear-gradient(135deg, #059669 0%, #065f46 100%)"
              disabled
              badge="Próximamente"
            />
            <FeatureCard
              title="Contingencias"
              description="Prevención, atención y cierre de eventos ambientales."
              imageUrl="https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=80&w=2670&auto=format&fit=crop"
              gradient="linear-gradient(135deg, #d97706 0%, #b45309 100%)"
              disabled
              badge="Próximamente"
            />
          </div>
        )}
      </div>

      {/* Footer Certifications */}
      <div className={styles.footer}>
        <Title3 style={{ color: CENIT_COLORS.blueBrand, marginBottom: '16px' }}>Nuestras Certificaciones</Title3>
        <div className={styles.certRow}>
          <img src="https://cenit-transporte.com/wp-content/uploads/2025/08/Recurso-1Logos.png" alt="Icontec" style={{ height: '60px', objectFit: 'contain' }} />
          <img src="https://cenit-transporte.com/wp-content/uploads/2025/08/Recurso-2Logos.png" alt="Top Employer" style={{ height: '60px', objectFit: 'contain' }} />
          <img src="https://cenit-transporte.com/wp-content/uploads/2025/08/Recurso-3Logos.png" alt="Par" style={{ height: '60px', objectFit: 'contain' }} />
          <img src="https://cenit-transporte.com/wp-content/uploads/2025/08/Recurso-4Logos.png" alt="Great Place To Work" style={{ height: '60px', objectFit: 'contain' }} />
        </div>
        <Caption1>CENIT Transporte y Logística de Hidrocarburos S.A.S</Caption1>
      </div>

    </div>
  );
};
