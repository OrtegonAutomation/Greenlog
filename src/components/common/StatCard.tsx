import React from 'react';
import { makeStyles, shorthands, Text, tokens } from '@fluentui/react-components';
import { CENIT_COLORS } from '../../theme/cenitTheme';

const useStyles = makeStyles({
    card: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        ...shorthands.padding('24px'),
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: CENIT_COLORS.cardShadow,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        ':hover': {
            transform: 'translateY(-5px)',
            boxShadow: CENIT_COLORS.cardHoverShadow,
        },
    },
    value: {
        fontSize: '48px',
        fontWeight: '900',
        color: CENIT_COLORS.blueBrand,
        lineHeight: '1',
        marginBottom: '8px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: CENIT_COLORS.graySub,
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    sub: {
        fontSize: '15px',
        color: CENIT_COLORS.grayText,
        maxWidth: '200px',
        lineHeight: '1.4',
    },
});

interface StatCardProps {
    value: string;
    label?: string;
    sub: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, sub }) => {
    const styles = useStyles();
    return (
        <div className={styles.card}>
            {label && <span className={styles.label}>{label}</span>}
            <span className={styles.value}>{value}</span>
            <span className={styles.sub}>{sub}</span>
        </div>
    );
};
