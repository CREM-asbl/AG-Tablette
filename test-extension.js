// Script de test pour vérifier les extensions de fichiers
import { configureSaveOptions } from '@controllers/Core/Managers/SaveFileManager.js';

// Mock des environnements
const mockEnvironments = {
  geometrie: {
    name: 'Geometrie',
    extensions: ['.agl']
  },
  grandeurs: {
    name: 'Grandeurs',
    extensions: ['.agg']
  },
  cubes: {
    name: 'Cubes',
    extensions: ['.agc']
  },
  tangram: {
    name: 'Tangram',
    extensions: ['.agt', '.ags'],
    isSilhouetteShown: false
  }
};

// Test des extensions
console.log('=== Test des extensions de fichiers ===\n');

Object.entries(mockEnvironments).forEach(([envName, env]) => {
  console.log(`Environnement: ${envName.toUpperCase()}`);
  const options = configureSaveOptions(env, env, 'test');
  console.log(`Extensions: ${env.extensions.join(', ')}`);
  console.log('Options de sauvegarde:');
  options.types.forEach((type, index) => {
    console.log(`  ${index + 1}. ${type.description}`);
    console.log(`     Accept: ${JSON.stringify(type.accept)}`);
  });
  console.log('');
});