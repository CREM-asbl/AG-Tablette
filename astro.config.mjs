import lit from '@astrojs/lit';
import { defineConfig } from 'astro/config';
import serviceWorker from 'astrojs-service-worker';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  base: '/',
  site: 'https://ag.crem.be',
  output: 'static',
  integrations: [lit(), serviceWorker()],
  vite: {
    resolve: {
      alias: {
        '@components': resolve(__dirname, './src/components'),
        '@controllers': resolve(__dirname, './src/controllers'),
        '@store': resolve(__dirname, './src/store'),
        '@styles': resolve(__dirname, './src/styles'),
        '@utils': resolve(__dirname, './src/utils'),
        '@services': resolve(__dirname, './src/services'),
        '@layouts': resolve(__dirname, './src/layouts'),
        '@pages': resolve(__dirname, './src/pages'),
        '@types': resolve(__dirname, './src/types'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Node Modules
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('lit')) return 'lit';
            }

            // Source Code
            if (id.includes('src/controllers')) return 'controllers';
            if (id.includes('src/components')) return 'components';
            if (id.includes('src/store')) return 'store';
            if (id.includes('src/utils') || id.includes('src/core') || id.includes('src/services')) return 'utils';
          }
        }
      }
    }
  }
})
