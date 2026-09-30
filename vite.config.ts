import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    envPrefix: ['VITE_', 'SUPABASE_'],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: ['app.vnscout.io.vn'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'charts-vendor';
              }
              if (id.includes('xlsx') || id.includes('file-saver')) {
                return 'excel-vendor';
              }
              if (id.includes('lucide-react') || id.includes('motion')) {
                return 'ui-vendor';
              }
              if (id.includes('qrcode')) {
                return 'qrcode-vendor';
              }
              if (id.includes('axios')) {
                return 'axios-vendor';
              }
            }
          },
        },
      },
    },
  };
});
