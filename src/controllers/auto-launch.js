import { appActions, fileToOpen } from '../store/appState';
import { loadEnvironnement } from './Core/Environment';

export const environmentsByExtensions = {
  agg: 'Grandeurs',
  agt: 'Tangram',
  ags: 'Tangram',
  agc: 'Cubes',
  agl: 'Geometrie',
};

export const getEnvironmentForFile = (filename) => {
  const extension = filename?.split('.').pop()?.toLowerCase();
  if (!extension || !Object.hasOwn(environmentsByExtensions, extension)) {
    return undefined;
  }
  return environmentsByExtensions[extension];
};

if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    // Nothing to do when the queue is empty.
    if (!launchParams.files.length) {
      return;
    }

    for (const fileHandle of launchParams.files) {
      const environment = getEnvironmentForFile(fileHandle.name);
      if (!environment) continue;

      try {
        await loadEnvironnement(environment);
      } catch (error) {
        console.error('Auto-launch: environnement non chargé', error);
        continue;
      }
      appActions.setFileToOpen(fileHandle);

      // Garde défensive : claim synchrone, aucun await entre set et get donc
      // toujours truthy aujourd'hui. Protège contre un futur lecteur
      // concurrent du signal (ex. ag-main réactif à fileToOpen).
      if (!fileToOpen.get()) continue;
      appActions.setFileToOpen(null);

      // ag-main ne consomme fileToOpen que dans firstUpdated (montage initial).
      // Si l'app est déjà montée, personne ne le lit : ouvrir ici directement.
      try {
        const { OpenFileManager } = await import(
          './Core/Managers/OpenFileManager'
        );
        await OpenFileManager.newReadFile(fileHandle);
      } catch (error) {
        console.error('Auto-launch: fichier non ouvert', error);
      }
    }
  });
}
