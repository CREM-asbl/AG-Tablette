//script de récupération du fichier de configuration manifest.json
// et mise à jour de l'affichage de la version

import { updateMetadata } from 'pwa-helpers/metadata';
import { app } from './App';

export const loadManifest = async () => {
  const manifest_file = await fetch('./manifest.json');
  const manifest = await manifest_file.json();
  app.version = manifest.version;
  app.short_name = manifest.short_name;
  return manifest;
};

loadManifest().then(manifest => {
  updateMetadata({ title: `${manifest.short_name} ${manifest.version}` });
});
