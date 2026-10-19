import { appActions } from '../store/appState';
import { loadEnvironnement } from './Core/Environment';

export const environmentsByExtensions = {
  agg: 'Grandeurs',
  agt: 'Tangram',
  ags: 'Tangram',
  agc: 'Cubes',
  agl: 'Geometrie',
};

if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    // Nothing to do when the queue is empty.
    if (!launchParams.files.length) {
      return;
    }

    for (const fileHandle of launchParams.files) {
      const pathArray = fileHandle.name.split('.');
      const extension = pathArray[pathArray.length - 1];
      const environment = environmentsByExtensions[extension];
      if (!environment) continue;

      await loadEnvironnement(environment);
      appActions.setFileToOpen(fileHandle);
    }
  });
}
