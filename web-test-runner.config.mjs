// web-test-runner.config.mjs
import alias from '@rollup/plugin-alias';
import { nodeResolve } from '@rollup/plugin-node-resolve'; // Importation nommée
import typescript from '@rollup/plugin-typescript';
import { rollupAdapter } from '@web/dev-server-rollup';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire les alias depuis tsconfig.json (simplifié, pour une utilisation plus robuste, un parseur JSON serait mieux)
// Pour l'instant, nous allons les coder en dur sur la base de votre tsconfig connu
const projectAliases = [
  { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
  { find: '@controllers', replacement: path.resolve(__dirname, 'src/controllers') },
  { find: '@layouts', replacement: path.resolve(__dirname, 'src/layouts') },
  { find: '@db', replacement: path.resolve(__dirname, 'src/firebase') },
  { find: '@config', replacement: path.resolve(__dirname, 'src/config') },
  { find: '@styles', replacement: path.resolve(__dirname, 'src/styles') },
  { find: '@store', replacement: path.resolve(__dirname, 'src/store') },
];

export default {
  files: ['test/**/*.test.js', 'test/**/*.test.ts'],
  nodeResolve: true, // Peut être redondant si @rollup/plugin-node-resolve est utilisé ci-dessous
  plugins: [
    rollupAdapter(
      alias({
        entries: projectAliases,
      })
    ),
    rollupAdapter(
      typescript({
        tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        // Assurez-vous que les déclarations de type sont générées si nécessaire
        // declaration: true,
        // declarationDir: './types',
      })
    ),
    rollupAdapter(nodeResolve()), // Pour résoudre les dépendances depuis node_modules
    // L'esbuildPlugin peut être retiré si typescript() de rollup gère tout
    // esbuildPlugin({
    //   ts: true,
    //   tsconfig: 'tsconfig.json'
    // }),
  ],
  // Optionnel: Configuration pour Mocha
  // mocha: {
  //   ui: 'bdd',
  //   timeout: '2000ms',
  // },
};
