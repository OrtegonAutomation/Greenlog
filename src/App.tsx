import React from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { cenitTheme } from './theme/cenitTheme';
import { AppShell } from './components/Shell/AppShell';

// App raíz - CENIT (GREENLOG) - Sistema de Control Ambiental
const App: React.FC = () => (
  <FluentProvider theme={cenitTheme}>
    <AppShell />
  </FluentProvider>
);

export default App;
