import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: mode === 'development',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        landing: resolve(__dirname, 'src/pages/landing.html'),
        dashboard: resolve(__dirname, 'src/pages/dashboard.html'),
        invoice: resolve(__dirname, 'src/pages/invoice.html'),
        history: resolve(__dirname, 'src/pages/invoice-history.html')
      },
      output: {
        manualChunks: {
          'vendor': ['jspdf', 'jspdf-autotable', 'sweetalert2'],
          'utils': [
            './src/assets/js/loading.js',
            './src/assets/js/notifications.js',
            './src/assets/js/themeManager.js'
          ]
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const type = assetInfo.name.split('.').pop();
          const dir = {
            css: 'css',
            js: 'js',
            png: 'images',
            jpg: 'images',
            jpeg: 'images',
            svg: 'images',
            gif: 'images',
            woff: 'fonts',
            woff2: 'fonts',
            ttf: 'fonts',
            eot: 'fonts'
          }[type] || '';
          return `assets/${dir}/[name]-[hash].[ext]`;
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    target: 'es2015',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500
  },
  server: {
    port: 3000,
    open: '/pages/landing.html',
    cors: true
  },
  preview: {
    port: 4173,
    open: true
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable', 'sweetalert2']
  },
  plugins: [
    mode === 'analyze' && visualizer({
      open: true,
      filename: '../stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean)
}));