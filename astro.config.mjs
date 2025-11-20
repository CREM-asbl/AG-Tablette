import lit from '@astrojs/lit';
import { defineConfig } from 'astro/config';
import serviceWorker from 'astrojs-service-worker';

// https://astro.build/config
export default defineConfig({
  base: '/',
  site: 'https://ag.crem.be',
  output: 'static',
  integrations: [lit(), serviceWorker()],
  vite: {
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
