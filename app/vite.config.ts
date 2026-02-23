import { defineConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const copyLandingToIndex = () => ({
  name: 'copy-landing-to-index',
  closeBundle() {
    const src = path.resolve(__dirname, 'build/landing.html');
    const dest = path.resolve(__dirname, 'build/index.html');
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  },
});

function landingPagePlugin() {
  return {
    name: 'landing-page-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/' || req.url === '') {
          const landingPath = path.resolve(__dirname, 'public/landing.html');
          if (fs.existsSync(landingPath)) {
            const content = fs.readFileSync(landingPath, 'utf-8');
            res.setHeader('Content-Type', 'text/html');
            res.end(content);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyLandingToIndex(), landingPagePlugin()],
  base: process.env.NODE_ENV === 'production' ? '/GLPal/' : '/',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      input: {
        landing: path.resolve(__dirname, 'public/landing.html'),
        'app/index': path.resolve(__dirname, 'app/index.html'),
        'app/privacy': path.resolve(__dirname, 'app/privacy.html'),
      },
      output: {
        dir: 'build',
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
