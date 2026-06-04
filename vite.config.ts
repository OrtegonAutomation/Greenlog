import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración para Power Apps Code App
// Ref: power.config.json → "localAppUrl": "http://localhost:5173/"
//                         → "buildPath": "./dist"
//                         → "buildEntryPoint": "index.html"
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4200,
    strictPort: false, // Deja que Vite suba al siguiente si 4200 está ocupado
  },
  base: process.env.GREENLOG_GITHUB_PAGES === 'true' ? '/Greenlog/' : './',
  build: {
    outDir: 'dist',
  },
});
