import React from 'react';
import { makeStyles, shorthands, tokens, Title3, Body1, Button } from '@fluentui/react-components';
import { ClipboardTaskListLtrRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXXL),
    ...shorthands.gap(tokens.spacingVerticalM),
    textAlign: 'center',
    animationName: {
      from: { opacity: '0', transform: 'translateY(16px)' },
      to:   { opacity: '1', transform: 'translateY(0)' },
    },
    animationDuration: '0.4s',
    animationFillMode: 'both',
    animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
  },
  iconWrap: {
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('50%'),
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
  },
  subtitle: { color: tokens.colorNeutralForeground3, maxWidth: '360px' },
});

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Sin actividades',
  subtitle = 'No hay actividades que coincidan con los filtros actuales.',
  actionLabel,
  onAction,
}) => {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <div className={styles.iconWrap}>
        <ClipboardTaskListLtrRegular fontSize={32} />
      </div>
      <Title3>{title}</Title3>
      <Body1 className={styles.subtitle}>{subtitle}</Body1>
      {actionLabel && onAction && (
        <Button appearance="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};
