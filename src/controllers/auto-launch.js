import { setState } from './Core/App';
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
      await loadEnvironnement(environmentsByExtensions[extension])
      setState({ fileToOpen: fileHandle });
    }
  });
}
