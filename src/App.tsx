import React from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { cenitTheme } from './theme/cenitTheme';
import { AuthProvider } from './auth/AuthContext';
import { LoginGate } from './components/Auth/LoginGate';
import { AppShell } from './components/Shell/AppShell';

// App raíz - CENIT (GREENLOG) - Sistema de Control Ambiental
// Entrada directa a Planeación Ambiental: el módulo de Provisiones quedó
// integrado dentro de Planeación (línea operativa "Compensaciones"), por lo
// que ya no se muestra el selector inicial de módulo.
const App: React.FC = () => {
  return (
    <FluentProvider theme={cenitTheme}>
      <AuthProvider>
        <LoginGate>
          <AppShell />
        </LoginGate>
      </AuthProvider>
    </FluentProvider>
  );
};

export default App;
