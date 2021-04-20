import { setState } from './Core/App';
import { loadEnvironnement } from './Core/Environments/Environment';

export const environmentsByExtensions = {
  agg: 'Grandeurs',
  agt: 'Tangram',
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
      setState({
        environment: await loadEnvironnement(
          environmentsByExtensions[extension],
        ),
        fileToOpen: fileHandle,
      });
    }
  });
}
