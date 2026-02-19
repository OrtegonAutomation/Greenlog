import React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  row: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalL),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  cell: {
    height: '16px',
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%)',
    backgroundSize: '800px 100%',
    animationName: {
      '0%':   { backgroundPosition: '-800px 0' },
      '100%': { backgroundPosition: '800px 0' },
    },
    animationDuration: '1.6s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    flexShrink: 0,
  },
});

const SkeletonCell: React.FC<{ width: string; delay?: string }> = ({ width, delay }) => {
  const styles = useStyles();
  return <div className={styles.cell} style={{ width, animationDelay: delay }} />;
};

export const SkeletonRow: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const styles = useStyles();
  return (
    <div className={styles.row}>
      <SkeletonCell width="30%"  delay={`${delay}ms`} />
      <SkeletonCell width="15%"  delay={`${delay + 40}ms`} />
      <SkeletonCell width="10%"  delay={`${delay + 80}ms`} />
      <SkeletonCell width="10%"  delay={`${delay + 120}ms`} />
      <SkeletonCell width="18%"  delay={`${delay + 160}ms`} />
      <SkeletonCell width="12%"  delay={`${delay + 200}ms`} />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonRow key={i} delay={i * 80} />
    ))}
  </>
);
