import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración para Power Apps Code App
// Ref: power.config.json → "localAppUrl": "http://localhost:3000/"
//                         → "buildPath": "./dist"
//                         → "buildEntryPoint": "index.html"
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true, // Falla si el puerto 3000 está ocupado (requerido por pac code run)
  },
  base: './', // CRITICAL: Permite que la app funcione en subcarpetas (SharePoint/GitHub Pages)
  build: {
    outDir: 'dist',
  },
});
