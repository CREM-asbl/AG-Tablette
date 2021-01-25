import { app } from "./Core/App";
import { Environment } from "./Core/Environments/Environment";
import { OpenFileManager } from "./Core/Managers/OpenFileManager";

if ('launchQueue' in window) {
  window.launchQueue.setConsumer((launchParams) => {
    // Nothing to do when the queue is empty.
    if (!launchParams.files.length) {
      return;
    }

    for (const fileHandle of launchParams.files) {
      const pathArray = fileHandle.split('.')
      const extension = pathArray[pathArray.length - 1]
      switch (extension) {
        case 'agg':
          app.environment = new Environment('Grandeurs')
          break
        case 'agt':
          app.environment = new Environment('Tangram')
          break
        case 'agc':
          app.environment = new Environment('Cubes')
          break
        case 'agl':
          app.environment = new Environment('Geometrie')
          break
      }
      OpenFileManager.newReadFile(fileHandle)
    }
  });
}