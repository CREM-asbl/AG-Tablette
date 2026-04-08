import lit from '@astrojs/lit';
import AstroPWA from '@vite-pwa/astro';
import { defineConfig } from 'astro/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// https://astro.build/config
export default defineConfig({
  base: '/',
  site: 'https://ag.crem.be',
  output: 'static',
  integrations: [
    lit(),
    AstroPWA({
      registerType: 'prompt',
      manifestFilename: 'manifest.json',
      includeAssets: [
        'images/favicon.ico',
        'images/apple-touch-icon.png',
        'images/manifest/maskable_icon.png',
        'images/manifest/icon-512.png',
      ],
      manifest: {
        version: pkgJson.version,
        name: 'Apprenti Géomètre mobile',
        short_name: 'AG mobile',
        id: '/',
        start_url: '/',
        display: 'fullscreen',
        display_override: ['window-controls-overlay'],
        theme_color: '#d3d3d3',
        background_color: '#d3d3d3',
        orientation: 'landscape',
        description:
          "Apprenti Géomètre mobile, la version d'Apprenti Géomètre qui peut également s'utiliser sur tablette",
        lang: 'fr-BE',
        dir: 'ltr',
        scope: '/',
        prefer_related_applications: false,
        handle_links: 'auto',
        icons: [
          {
            src: 'images/manifest/maskable_icon.png',
            sizes: '640x640',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'images/manifest/maskable_icon.png',
            sizes: '640x640',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        file_handlers: [
          {
            action: '/',
            accept: {
              'application/agmobile': ['.agg', '.agt', '.ags', '.agc', '.agl'],
            },
          },
        ],
        protocol_handlers: [
          {
            protocol: 'web+agm',
            url: '/?interface=%s',
          },
        ],
        shortcuts: [
          {
            name: 'Grandeurs',
            description: 'Ouvre la partie Grandeurs',
            url: '/?interface=Grandeurs',
            icons: [
              {
                src: 'images/Environnements/logo_grandeurs_96x96.svg',
                sizes: 'any',
              },
            ],
          },
          {
            name: 'Tangram',
            description: 'Ouvre la partie Tangram',
            url: '/?interface=Tangram',
            icons: [
              {
                src: 'images/Environnements/logo_tangram_96x96.svg',
                sizes: 'any',
              },
            ],
          },
          {
            name: 'Cubes',
            description: 'Ouvre la partie Cubes',
            url: '/?interface=Cubes',
            icons: [
              {
                src: 'images/Environnements/logo_cubes_96x96.svg',
                sizes: 'any',
              },
            ],
          },
          {
            name: 'Géometrie',
            description: 'Ouvre la partie Géométrie',
            url: '/?interface=Geometrie',
            icons: [
              {
                src: 'images/Environnements/logo_geometrie_96x96.svg',
                sizes: 'any',
              },
            ],
          },
        ],
        screenshots: [
          {
            src: 'images/manifest/screenshot1.webp',
            sizes: '1920x1080',
            type: 'image/webp',
            form_factor: 'wide',
          },
          {
            src: 'images/manifest/screenshot2.webp',
            sizes: '1280x800',
            type: 'image/webp',
          },
        ],
        related_applications: [
          {
            platform: 'play',
            url: 'https://play.google.com/store/apps/details?id=be.crem.ag.twa',
            id: 'be.crem.ag.twa',
          },
          {
            platform: 'windows',
            url: 'https://www.microsoft.com/store/apps/9N7GCZKN4404',
            id: '9N7GCZKN4404',
          },
        ],
        categories: ['education', 'kids', 'utilities'],
      },
      workbox: {
        // Pré-cache les pages et assets statiques
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
        // Exclure les fichiers trop gros et les données
        globIgnores: ['**/data/**'],
        // Cache runtime pour les fichiers d'activités (.agg, .agl)
        runtimeCaching: [
          {
            urlPattern: /\.(?:agg|agl|agt|ags|agc)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'ag-activities-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
              },
            },
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ag-firebase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Ne pas pré-cacher les SW eux-mêmes
        navigateFallback: null,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@components': resolve(__dirname, './src/components'),
        '@controllers': resolve(__dirname, './src/controllers'),
        '@core': resolve(__dirname, './src/core'),
        '@store': resolve(__dirname, './src/store'),
        '@styles': resolve(__dirname, './src/styles'),
        '@utils': resolve(__dirname, './src/utils'),
        '@services': resolve(__dirname, './src/services'),
        '@layouts': resolve(__dirname, './src/layouts'),
        '@pages': resolve(__dirname, './src/pages'),
        '@types': resolve(__dirname, './src/types'),
        '@firebase': resolve(__dirname, './src/firebase'),
        '@db': resolve(__dirname, './src/firebase'),
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
            if (id.includes('src/utils') || id.includes('src/core') || id.includes('src/services'))
              return 'utils';
          },
        },
      },
    },
  },
});
