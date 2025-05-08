import * as path from 'path'; // Correction de l'importation
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Définit l'environnement de test sur jsdom
    globals: true, // Active les globales de Vitest (describe, it, expect, etc.)
    setupFiles: [], // Vous pouvez ajouter des fichiers de configuration ici si nécessaire
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/**', // Exclure le dossier Playwright tests
      '**/tests-examples/**' // Exclure le dossier Playwright tests-examples
    ],
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@controllers': path.resolve(__dirname, './src/controllers'),
      '@services': path.resolve(__dirname, './src/services'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@store': path.resolve(__dirname, './src/store'), // Ajout de l'alias @store
      // Ajoutez d'autres alias si nécessaire
    },
  },
})
