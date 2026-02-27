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
      if (req.url === '/blog' || req.url === '/blog/' || req.url === '/blog/index.html') {
        const blogIndexPath = path.resolve(__dirname, 'landing/blog/index.html');
        if (fs.existsSync(blogIndexPath)) {
          let content = fs.readFileSync(blogIndexPath, 'utf-8');
          content = content.replace(/href="\.\.\//g, 'href="../');
          content = content.replace(/href="posts\//g, 'href="posts/');
          res.setHeader('Content-Type', 'text/html');
          res.end(content);
          return;
        }
      }
      if (req.url === '/blog/post.html' || req.url.startsWith('/blog/post.html?')) {
        const blogPostPath = path.resolve(__dirname, 'landing/blog/post.html');
        if (fs.existsSync(blogPostPath)) {
          let content = fs.readFileSync(blogPostPath, 'utf-8');
          content = content.replace(/href="\.\.\//g, 'href="../');
          res.setHeader('Content-Type', 'text/html');
          res.end(content);
          return;
        }
      }
      if (req.url.startsWith('/blog/posts/')) {
        const postPath = path.resolve(__dirname, 'landing/' + req.url);
        if (fs.existsSync(postPath)) {
          res.setHeader('Content-Type', 'text/markdown');
          res.end(fs.readFileSync(postPath, 'utf-8'));
          return;
        }
      }
      if (req.url.startsWith('/blog/css/') || req.url.startsWith('/blog/js/')) {
        const assetPath = path.resolve(__dirname, 'landing/' + req.url);
        if (fs.existsSync(assetPath)) {
          const ext = path.extname(assetPath);
          const contentType = ext === '.css' ? 'text/css' : 'application/javascript';
          res.setHeader('Content-Type', contentType);
          res.end(fs.readFileSync(assetPath, 'utf-8'));
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

    // Copy blog files to build
    const blogDir = path.resolve(__dirname, 'landing/blog');
    const blogBuildDir = path.resolve(buildDir, 'blog');
    if (fs.existsSync(blogDir)) {
      // Create blog directory
      if (!fs.existsSync(blogBuildDir)) {
        fs.mkdirSync(blogBuildDir, { recursive: true });
      }
      
      // Copy blog index.html
      const blogIndexSrc = path.resolve(blogDir, 'index.html');
      const blogIndexDest = path.resolve(blogBuildDir, 'index.html');
      if (fs.existsSync(blogIndexSrc)) {
        let content = fs.readFileSync(blogIndexSrc, 'utf-8');
        content = content.replace(/href="\.\.\//g, 'href="../');
        content = content.replace(/href="css\//g, 'href="css/');
        content = content.replace(/href="js\//g, 'href="js/');
        fs.writeFileSync(blogIndexDest, content);
      }
      
      // Copy blog post.html
      const blogPostSrc = path.resolve(blogDir, 'post.html');
      const blogPostDest = path.resolve(blogBuildDir, 'post.html');
      if (fs.existsSync(blogPostSrc)) {
        let content = fs.readFileSync(blogPostSrc, 'utf-8');
        content = content.replace(/href="\.\.\//g, 'href="../');
        content = content.replace(/href="css\//g, 'href="css/');
        content = content.replace(/href="js\//g, 'href="js/');
        fs.writeFileSync(blogPostDest, content);
      }
      
      // Copy css directory
      const cssDir = path.resolve(blogDir, 'css');
      const cssBuildDir = path.resolve(blogBuildDir, 'css');
      if (fs.existsSync(cssDir) && !fs.existsSync(cssBuildDir)) {
        fs.cpSync(cssDir, cssBuildDir, { recursive: true });
      }
      
      // Copy js directory
      const jsDir = path.resolve(blogDir, 'js');
      const jsBuildDir = path.resolve(blogBuildDir, 'js');
      if (fs.existsSync(jsDir) && !fs.existsSync(jsBuildDir)) {
        fs.cpSync(jsDir, jsBuildDir, { recursive: true });
      }
      
      // Copy posts directory
      const postsDir = path.resolve(blogDir, 'posts');
      const postsBuildDir = path.resolve(blogBuildDir, 'posts');
      if (fs.existsSync(postsDir) && !fs.existsSync(postsBuildDir)) {
        fs.cpSync(postsDir, postsBuildDir, { recursive: true });
      }
      
      console.log('Blog files copied to build');
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
        'blog/index': path.resolve(__dirname, 'landing/blog/index.html'),
        'blog/post': path.resolve(__dirname, 'landing/blog/post.html'),
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
