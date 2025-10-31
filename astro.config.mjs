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
          manualChunks: {
            // Séparer les gros modules en chunks
            'controllers': ['src/controllers'],
            'firebase': ['firebase/app', 'firebase/firestore', 'firebase/storage', 'firebase/auth', 'firebase/analytics'],
            'lit': ['lit', '@lit-labs/signals', 'lit-html'],
            'utils': ['src/utils', 'src/core', 'src/services'],
            'components': ['src/components'],
            'store': ['src/store']
          }
        }
      }
    }
  }
})
