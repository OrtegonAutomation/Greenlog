import React, { useMemo } from 'react';
import {
    makeStyles, shorthands, tokens,
    Title2, Title3, Body1, Subtitle2, Caption1,
    Card, CardHeader, Button
} from '@fluentui/react-components';
import {
    DataBarVerticalRegular,
    OrganizationRegular,
    CheckmarkCircleRegular,
    ArrowTrendingLinesRegular,
} from '@fluentui/react-icons';
import { useActividades } from '../../hooks/useActividades';
import { CENIT_COLORS } from '../../theme/cenitTheme';

const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap(tokens.spacingVerticalL),
        animationName: {
            from: { opacity: '0', transform: 'translateY(10px)' },
            to: { opacity: '1', transform: 'translateY(0)' },
        },
        animationDuration: '0.4s',
        animationFillMode: 'both',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        ...shorthands.gap(tokens.spacingVerticalS, tokens.spacingHorizontalM),
        background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
        backdropFilter: 'blur(10px)',
        ...shorthands.padding('24px'),
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        marginBottom: tokens.spacingVerticalL,
        border: '1px solid rgba(255,255,255,0.5)',
    },
    headerLeft: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('4px'),
    },
    subtitle: {
        color: tokens.colorNeutralForeground2,
    },

    // KPI Grid
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        ...shorthands.gap(tokens.spacingHorizontalL),
    },
    kpiCard: {
        ...shorthands.padding(tokens.spacingVerticalL),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: '16px',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        ':hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.9)',
        },
    },
    kpiIconWrap: {
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    kpiValue: {
        fontSize: '36px',
        fontWeight: '800',
        color: '#003057',
        lineHeight: '1',
        marginBottom: '4px',
    },
    kpiLabel: {
        color: tokens.colorNeutralForeground2,
        fontSize: '14px',
        fontWeight: '500',
    },

    // Charts
    chartContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        ...shorthands.gap(tokens.spacingHorizontalL),
        marginTop: tokens.spacingVerticalL,
    },
    chartCard: {
        ...shorthands.padding('24px'),
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
    },
    barChart: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap(tokens.spacingVerticalM),
        marginTop: tokens.spacingVerticalL,
    },
    barRow: {
        display: 'flex',
        alignItems: 'center',
    },
    barLabel: {
        width: '110px',
        fontSize: '13px',
        fontWeight: '500',
        color: tokens.colorNeutralForeground1,
    },
    barTrack: {
        flex: 1,
        height: '12px',
        background: 'rgba(0,0,0,0.04)',
        borderRadius: '6px',
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: '8px',
        color: 'white',
        fontSize: '10px',
        fontWeight: '700',
        transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
    },

    // Donut
    donutWrap: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 0',
    },
    donutChart: {
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    },
    donutHole: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.95)',
        position: 'absolute',
        top: '30px',
        left: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
    }
});

export const ReportesModule: React.FC = () => {
    const styles = useStyles();
    const { actividades } = useActividades();

    const stats = useMemo(() => {
        const total = actividades.length;
        const closed = actividades.filter(a => a.estado === 'Cerrada').length;
        const pending = actividades.filter(a => a.estado === 'Pendiente Aprobación').length;
        const execution = actividades.filter(a => a.estado === 'En Ejecución').length;
        const planned = actividades.filter(a => a.estado === 'Planeada').length;

        const byType = actividades.reduce((acc, curr) => {
            acc[curr.tipo] = (acc[curr.tipo] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { total, closed, pending, execution, planned, byType };
    }, [actividades]);

    const completionRate = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;

    // Donut chart syntax
    const donutStyle = {
        background: `conic-gradient(
      ${CENIT_COLORS.green} 0% ${completionRate}%, 
      #e2e8f0 ${completionRate}% 100%
    )`
    };

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Title2 style={{ color: '#003057', fontWeight: 700 }}>Reportes e Indicadores</Title2>
                    <Body1 className={styles.subtitle}>
                        Análisis de gestión ambiental y cumplimiento de metas
                    </Body1>
                </div>
                <Button appearance="subtle" icon={<ArrowTrendingLinesRegular />}>Exportar Informe</Button>
            </div>

            <div className={styles.kpiGrid}>
                <Card className={styles.kpiCard}>
                    <div className={styles.kpiIconWrap} style={{ background: 'rgba(22, 163, 74, 0.1)' }}>
                        <CheckmarkCircleRegular fontSize={28} color={CENIT_COLORS.green} />
                    </div>
                    <span className={styles.kpiValue}>{stats.closed}</span>
                    <span className={styles.kpiLabel}>Actividades Cerradas</span>
                </Card>

                <Card className={styles.kpiCard}>
                    <div className={styles.kpiIconWrap} style={{ background: 'rgba(0, 75, 135, 0.1)' }}>
                        <DataBarVerticalRegular fontSize={28} color={CENIT_COLORS.blueBrand} />
                    </div>
                    <span className={styles.kpiValue}>{stats.execution}</span>
                    <span className={styles.kpiLabel}>En Ejecución</span>
                </Card>

                <Card className={styles.kpiCard}>
                    <div className={styles.kpiIconWrap} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                        <OrganizationRegular fontSize={28} color="#f59e0b" />
                    </div>
                    <span className={styles.kpiValue}>{stats.pending}</span>
                    <span className={styles.kpiLabel}>Pendientes de Aprobación</span>
                </Card>

                {/* Total stats card */}
                <Card className={styles.kpiCard}>
                    <div className={styles.kpiIconWrap} style={{ background: 'rgba(0,0,0, 0.05)' }}>
                        <Title3>Σ</Title3>
                    </div>
                    <span className={styles.kpiValue}>{stats.total}</span>
                    <span className={styles.kpiLabel}>Total Registros</span>
                </Card>
            </div>

            <div className={styles.chartContainer} id="reportes-charts">
                {/* Compliance Chart */}
                <Card className={styles.chartCard}>
                    <CardHeader header={<Title3 style={{ color: '#003057' }}>Cumplimiento General</Title3>} />
                    <div className={styles.donutWrap}>
                        <div className={styles.donutChart} style={donutStyle}>
                            <div className={styles.donutHole}>
                                <span style={{ fontSize: '32px', fontWeight: '800', color: CENIT_COLORS.green, lineHeight: 1 }}>{completionRate}%</span>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: tokens.colorNeutralForeground3, letterSpacing: '0.5px' }}>COMPLETADO</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <Caption1>Basado en actividades cerradas sobre el total planificado.</Caption1>
                    </div>
                </Card>

                {/* Type Distribution */}
                <Card className={styles.chartCard}>
                    <CardHeader header={<Title3 style={{ color: '#003057' }}>Actividades por Tipo</Title3>} />
                    <div className={styles.barChart}>
                        {Object.entries(stats.byType).map(([type, count]) => {
                            const percentage = Math.round((count / stats.total) * 100);
                            // Color logic
                            let barColor = CENIT_COLORS.green;
                            if (type === 'Monitoreo') barColor = CENIT_COLORS.blueBrand;
                            if (type === 'Mantenimiento') barColor = '#f59e0b';
                            if (type === 'Auditoría') barColor = '#6366f1';

                            return (
                                <div key={type} className={styles.barRow}>
                                    <div className={styles.barLabel}>{type}</div>
                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFill}
                                            style={{
                                                width: `${percentage}%`,
                                                background: barColor,
                                                boxShadow: `0 2px 6px ${barColor}40`
                                            }}
                                        />
                                    </div>
                                    <div style={{ width: '40px', textAlign: 'right', fontWeight: '600', fontSize: '12px' }}>{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ReportesModule;
