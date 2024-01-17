import lit from '@astrojs/lit';
import { defineConfig } from 'astro/config';
import serviceWorker from 'astrojs-service-worker';

// https://astro.build/config
export default defineConfig({
  base: '/',
  site: 'https://ag.crem.be',
  output: 'static',
  integrations: [lit(), serviceWorker()],
})
