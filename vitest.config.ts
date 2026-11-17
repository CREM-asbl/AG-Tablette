import * as path from 'path'; // Correction de l'importation
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Définit l'environnement de test sur jsdom
    globals: true, // Active les globales de Vitest (describe, it, expect, etc.)
    setupFiles: ['./test/setup.ts'], // Fichier de setup pour les mocks
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/**', // Exclure le dossier Playwright tests
      '**/tests-examples/**', // Exclure le dossier Playwright tests-examples
    ],
  },
  resolve: {
      alias: {
        '@components': path.resolve(import.meta.dirname, './src/components'),
        '@controllers': path.resolve(import.meta.dirname, './src/controllers'),
        '@core': path.resolve(import.meta.dirname, './src/core'),
        '@layouts': path.resolve(import.meta.dirname, './src/layouts'),
        '@services': path.resolve(import.meta.dirname, './src/services'),
        '@styles': path.resolve(import.meta.dirname, './src/styles'),
        '@utils': path.resolve(import.meta.dirname, './src/utils'),
        '@store': path.resolve(import.meta.dirname, './src/store'),
        '@db': path.resolve(import.meta.dirname, './src/firebase'),
        '@pages': path.resolve(import.meta.dirname, './src/pages'),
        '@types': path.resolve(import.meta.dirname, './src/types'),
      },
    },
});
