import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Title1,
  Body1,
  Caption1,
} from '@fluentui/react-components';
import { MailRegular, LockClosedRegular } from '@fluentui/react-icons';
import { useAuth } from '../../auth/AuthContext';
import { CENIT_COLORS } from '../../theme/cenitTheme';
import GreenLogBlanco from '../../assets/GreenLog Blanco.png';

const useStyles = makeStyles({
  root: {
    minHeight: '100svh',
    display: 'grid',
    placeItems: 'center',
    ...shorthands.padding('32px'),
    overflowY: 'visible',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    background: `
      radial-gradient(circle at 18% 18%, rgba(140,198,63,0.22) 0, transparent 28%),
      radial-gradient(circle at 78% 18%, rgba(0,86,210,0.25) 0, transparent 30%),
      linear-gradient(135deg, #001a5c 0%, #003057 52%, #0b3b2f 100%)
    `,
    color: '#fff',
    '@media (max-width: 820px)': {
      placeItems: 'start center',
      ...shorthands.padding('18px'),
    },
  },
  card: {
    width: 'min(960px, 100%)',
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    overflow: 'hidden',
    minWidth: 0,
    borderRadius: '28px',
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(24px)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.22)'),
    boxShadow: '0 24px 80px rgba(0,0,0,0.32)',
    '@media (max-width: 820px)': {
      gridTemplateColumns: '1fr',
      maxWidth: '560px',
      marginBottom: '18px',
    },
  },
  brandPanel: {
    position: 'relative',
    minHeight: '460px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    ...shorthands.padding('42px'),
    background: `linear-gradient(145deg, rgba(0,48,87,0.95) 0%, rgba(0,51,160,0.74) 100%),
      url('https://cenit-transporte.com/wp-content/uploads/2025/10/geodesicos1.jpg') center/cover`,
    '@media (max-width: 620px)': {
      minHeight: '260px',
      ...shorthands.padding('24px'),
    },
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('18px'),
    flexWrap: 'wrap',
  },
  cenitLogo: {
    height: '46px',
    objectFit: 'contain',
    '@media (max-width: 620px)': {
      height: '34px',
    },
  },
  greenlogLogo: {
    width: '66px',
    height: '66px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.24))',
    '@media (max-width: 620px)': {
      width: '48px',
      height: '48px',
    },
  },
  brandCopy: {
    maxWidth: '520px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  eyebrow: {
    width: 'fit-content',
    ...shorthands.padding('6px', '12px'),
    borderRadius: '999px',
    background: 'rgba(140,198,63,0.2)',
    ...shorthands.border('1px', 'solid', 'rgba(140,198,63,0.42)'),
    color: '#d9f99d',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '44px',
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: '-0.04em',
    color: '#fff',
    '@media (max-width: 620px)': {
      fontSize: '32px',
    },
  },
  subtitle: {
    maxWidth: '460px',
    color: 'rgba(255,255,255,0.84)',
    fontSize: '16px',
    lineHeight: 1.6,
    '@media (max-width: 620px)': {
      fontSize: '14px',
      lineHeight: 1.45,
    },
  },
  formPanel: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    ...shorthands.gap('18px'),
    ...shorthands.padding('42px'),
    background: 'rgba(255,255,255,0.94)',
    color: tokens.colorNeutralForeground1,
    minWidth: 0,
    '@media (max-width: 620px)': {
      ...shorthands.padding('24px'),
    },
  },
  formHeader: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    marginBottom: '10px',
  },
  lockBadge: {
    width: '44px',
    height: '44px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '14px',
    background: 'rgba(0,48,87,0.08)',
    color: CENIT_COLORS.blueBrand,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    minWidth: 0,
  },
  helper: {
    color: tokens.colorNeutralForeground3,
    lineHeight: 1.5,
  },
  errorBar: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  errorBody: {
    minWidth: 0,
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    lineHeight: 1.4,
  },
});

interface LoginGateProps {
  onLoginSuccess?: () => void;
  loadingOnly?: boolean;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onLoginSuccess, loadingOnly = false }) => {
  const styles = useStyles();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('greenlog-login-scroll');
    document.body.classList.add('greenlog-login-scroll');
    return () => {
      document.documentElement.classList.remove('greenlog-login-scroll');
      document.body.classList.remove('greenlog-login-scroll');
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? 'No fue posible iniciar sesión.');
      return;
    }
    if (result.pendingConfirmation) {
      setSuccess(result.message ?? 'Cuenta activada. Vuelve a ingresar con tu contraseña.');
      return;
    }
    onLoginSuccess?.();
  };

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <section className={styles.brandPanel}>
          <div className={styles.logoRow}>
            <img
              src="https://cenit-transporte.com/wp-content/uploads/2025/10/cobranding-en-blanco.png"
              alt="CENIT Grupo Ecopetrol"
              className={styles.cenitLogo}
            />
            <img src={GreenLogBlanco} alt="GreenLog" className={styles.greenlogLogo} />
          </div>
          <div className={styles.brandCopy}>
            <span className={styles.eyebrow}>Acceso temporal</span>
            <Title1 className={styles.title}>GreenLog Ambiental</Title1>
            <Body1 className={styles.subtitle}>
              Ingresa con el correo registrado en la matriz del equipo ambiental CENIT y la contraseña temporal asignada.
              Esta barrera temporal se reemplazará por Entra ID.
            </Body1>
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.lockBadge}>
            <LockClosedRegular fontSize={24} />
          </div>
          <div className={styles.formHeader}>
            <Title1 style={{ color: CENIT_COLORS.blueBrand, fontSize: '30px', lineHeight: 1.1 }}>
              {loadingOnly ? 'Validando sesión' : 'Validar acceso'}
            </Title1>
            <Caption1 className={styles.helper}>
              {loadingOnly
                ? 'Estamos restaurando tu acceso a GreenLog.'
                : 'Solo los usuarios autorizados pueden consultar, planear o revisar actividades ambientales.'}
            </Caption1>
          </div>

          {error && (
            <MessageBar intent="error" className={styles.errorBar}>
              <MessageBarBody className={styles.errorBody}>
                <MessageBarTitle>No fue posible iniciar sesión</MessageBarTitle>
                {error}
              </MessageBarBody>
            </MessageBar>
          )}

          {success && (
            <MessageBar intent="success" className={styles.errorBar}>
              <MessageBarBody className={styles.errorBody}>
                <MessageBarTitle>Cuenta activada</MessageBarTitle>
                {success}
              </MessageBarBody>
            </MessageBar>
          )}

          {!loadingOnly && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <Input
                type="email"
                required
                size="large"
                autoComplete="username"
                value={email}
                onChange={(_, data) => {
                  setEmail(data.value);
                  setError('');
                  setSuccess('');
                }}
                contentBefore={<MailRegular />}
                placeholder="correo@cenit-transporte.com"
              />
              <Input
                type="password"
                required
                size="large"
                autoComplete="current-password"
                value={password}
                onChange={(_, data) => {
                  setPassword(data.value);
                  setError('');
                  setSuccess('');
                }}
                contentBefore={<LockClosedRegular />}
                placeholder="Contraseña temporal"
              />
              <Button
                appearance="primary"
                size="large"
                type="submit"
                disabled={!email.trim() || !password.trim() || submitting}
                style={{ background: CENIT_COLORS.green, color: '#003057', fontWeight: 800 }}
              >
                {submitting ? 'Validando...' : 'Entrar a GreenLog'}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
