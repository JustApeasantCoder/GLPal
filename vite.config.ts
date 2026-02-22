import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isElectron = process.env.ELECTRON === 'true' || process.env.ELECTRON_DEV === 'true';

export default defineConfig({
  plugins: [react()],
  base: isElectron ? './' : './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    base: '/GLPal/',
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
