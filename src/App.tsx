import React, { useEffect, useMemo } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { cenitTheme } from './theme/cenitTheme';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/AuthContext';
import { LoginGate } from './components/Auth/LoginGate';
import { AppShell } from './components/Shell/AppShell';

const getBasePath = () => {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.toLowerCase().startsWith('/greenlog') ? '/Greenlog' : '';
};

const getRoutePaths = () => {
  const basePath = getBasePath();
  return {
    basePath,
    homePath: basePath ? `${basePath}/` : '/',
    loginPath: `${basePath}/login`,
  };
};

const normalizePath = (path: string) => path.replace(/\/+$/, '').toLowerCase() || '/';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const paths = useMemo(() => getRoutePaths(), []);
  const currentPath = typeof window === 'undefined' ? '/' : normalizePath(window.location.pathname);
  const loginPath = normalizePath(paths.loginPath);
  const isLoginRoute = currentPath === loginPath;

  const goHome = () => {
    window.history.replaceState(null, '', paths.homePath);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!currentUser && !isLoginRoute) {
      window.history.replaceState(null, '', paths.loginPath);
    }

    if (currentUser && isLoginRoute) {
      goHome();
    }
  }, [currentUser, isLoginRoute, paths.loginPath]);

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
