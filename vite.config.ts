import { defineConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production';
const isElectron = process.env.ELECTRON === 'true';

const base = isProd ? (isElectron ? './' : '/') : '/';

const landingPagePlugin = () => ({
  name: 'landing-page-plugin',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/' || req.url === '') {
        const landingPath = path.resolve(__dirname, 'landing/index.html');
        if (fs.existsSync(landingPath)) {
          let content = fs.readFileSync(landingPath, 'utf-8');
          content = content.replace(/href="\/app\/"/g, `href="${base}app/"`);
          content = content.replace(/href="\/privacy"/g, `href="${base}privacy"`);
          res.setHeader('Content-Type', 'text/html');
          res.end(content);
          return;
        }
      }
      if (req.url === '/privacy' || req.url === '/privacy.html') {
        const privacyPath = path.resolve(__dirname, 'landing/privacy.html');
        if (fs.existsSync(privacyPath)) {
          let content = fs.readFileSync(privacyPath, 'utf-8');
          content = content.replace(/href="\/app\/"/g, `href="${base}app/"`);
          content = content.replace(/href="\/privacy"/g, `href="${base}privacy"`);
          content = content.replace(/href="\/terms"/g, `href="${base}terms"`);
          res.setHeader('Content-Type', 'text/html');
          res.end(content);
          return;
        }
      }
      if (req.url === '/terms' || req.url === '/terms.html') {
        const termsPath = path.resolve(__dirname, 'landing/terms.html');
        if (fs.existsSync(termsPath)) {
          let content = fs.readFileSync(termsPath, 'utf-8');
          content = content.replace(/href="\/app\/"/g, `href="${base}app/"`);
          content = content.replace(/href="\/privacy"/g, `href="${base}privacy"`);
          content = content.replace(/href="\/terms"/g, `href="${base}terms"`);
          res.setHeader('Content-Type', 'text/html');
          res.end(content);
          return;
        }
      }
      next();
    });
  },
});

const fixBuildPaths = () => ({
  name: 'fix-build-paths',
  closeBundle() {
    const buildDir = path.resolve(__dirname, 'build');
    const landingDir = path.resolve(buildDir, 'landing');
    
    if (fs.existsSync(landingDir)) {
      const files = [
        { src: 'landing/index.html', dest: 'index.html' },
        { src: 'landing/app/index.html', dest: 'app/index.html' },
      ];
      
      files.forEach(({ src, dest }) => {
        const srcPath = path.resolve(buildDir, src);
        const destPath = path.resolve(buildDir, dest);
        if (fs.existsSync(srcPath)) {
          let content = fs.readFileSync(srcPath, 'utf-8');
          content = content.replace(/href="\/app\/"/g, `href="${base}app/"`);
          content = content.replace(/href="\/privacy"/g, `href="${base}privacy"`);
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.writeFileSync(destPath, content);
        }
      });
      
      fs.rmSync(landingDir, { recursive: true });
    }
    
    const privacySrc = path.resolve(__dirname, 'landing/privacy.html');
    const privacyDest = path.resolve(buildDir, 'privacy.html');
    if (fs.existsSync(privacySrc)) {
      let content = fs.readFileSync(privacySrc, 'utf-8');
      content = content.replace(/href="\/terms"/g, `href="${base}terms"`);
      fs.writeFileSync(privacyDest, content);
    }

    const termsSrc = path.resolve(__dirname, 'landing/terms.html');
    const termsDest = path.resolve(buildDir, 'terms.html');
    if (fs.existsSync(termsSrc)) {
      let content = fs.readFileSync(termsSrc, 'utf-8');
      content = content.replace(/href="\/terms"/g, `href="${base}terms"`);
      fs.writeFileSync(termsDest, content);
    }

    // Add prefetch hints for app assets to speed up app load
    const landingIndex = path.resolve(buildDir, 'index.html');
    if (fs.existsSync(landingIndex)) {
      let content = fs.readFileSync(landingIndex, 'utf-8');
      
      // Find app assets and add prefetch links
      const assetsDir = path.resolve(buildDir, 'assets');
      const appAssetsDir = path.resolve(buildDir, 'assets', 'app');
      
      let prefetchLinks = '';
      
      // Prefetch app JS bundle
      if (fs.existsSync(appAssetsDir)) {
        const appJsFiles = fs.readdirSync(appAssetsDir).filter(f => f.endsWith('.js'));
        appJsFiles.forEach(file => {
          prefetchLinks += `  <link rel="prefetch" href="/assets/app/${file}">\n`;
        });
      }
      
      // Prefetch main CSS
      const mainCssFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('index-') && f.endsWith('.css'));
      mainCssFiles.forEach(file => {
        prefetchLinks += `  <link rel="prefetch" href="/assets/${file}">\n`;
      });
      
      // Prefetch medication progress bar JS (lazy loaded)
      const medicationFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('MedicationProgressBar-') && f.endsWith('.js'));
      medicationFiles.forEach(file => {
        prefetchLinks += `  <link rel="prefetch" href="/assets/${file}">\n`;
      });
      
      // Insert prefetch links before </head>
      if (prefetchLinks) {
        content = content.replace('</head>', `${prefetchLinks}</head>`);
        fs.writeFileSync(landingIndex, content);
        console.log('Added prefetch hints for app assets');
      }
    }
  },
});

export default defineConfig({
  plugins: [react(), landingPagePlugin(), fixBuildPaths()],
  base,
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
        index: path.resolve(__dirname, 'landing/index.html'),
        'app/index': path.resolve(__dirname, 'app/index.html'),
        privacy: path.resolve(__dirname, 'landing/privacy.html'),
        terms: path.resolve(__dirname, 'landing/terms.html'),
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
