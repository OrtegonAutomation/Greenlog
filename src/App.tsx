import React, { useEffect, useMemo } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { cenitTheme } from './theme/cenitTheme';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/AuthContext';
import { LoginGate } from './components/Auth/LoginGate';
import { AppShell } from './components/Shell/AppShell';
import { getLoginPath, getSectionPath, isLoginPath } from './utils/appRoutes';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const loginPath = useMemo(() => getLoginPath(), []);
  const homePath = useMemo(() => getSectionPath('dashboard'), []);
  const loginRoute = typeof window === 'undefined' ? false : isLoginPath();

  const goHome = () => {
    window.history.replaceState(null, '', homePath);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!currentUser && !loginRoute) {
      window.history.replaceState(null, '', loginPath);
    }

    if (currentUser && loginRoute) {
      goHome();
    }
  }, [currentUser, loginPath, loginRoute]);

  if (!currentUser) {
    return <LoginGate onLoginSuccess={goHome} />;
  }

  return <AppShell />;
};

// App raíz - CENIT (GREENLOG) - Sistema de Control Ambiental
// Entrada directa a Planeación Ambiental: el módulo de Provisiones quedó
// integrado dentro de Planeación (línea operativa "Compensaciones"), por lo
// que ya no se muestra el selector inicial de módulo.
const App: React.FC = () => {
  return (
    <FluentProvider theme={cenitTheme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </FluentProvider>
  );
};

export default App;
