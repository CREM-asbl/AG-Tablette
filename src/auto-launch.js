import { app, setState } from './Core/App';
import { Environment } from './Core/Environments/Environment';
import { OpenFileManager } from './Core/Managers/OpenFileManager';

export const environmentsByExtensions = {
    'agg': 'Grandeurs',
    'agt': 'Tangram',
    'agc': 'Cubes',
    'agl': 'Geometrie'
}

if ('launchQueue' in window) {
    window.launchQueue.setConsumer(launchParams => {
        // Nothing to do when the queue is empty.
        if (!launchParams.files.length) {
            return;
        }

        for (const fileHandle of launchParams.files) {
            const pathArray = fileHandle.name.split('.')
            const extension = pathArray[pathArray.length - 1]
            setState({ environnement: new Environment(environmentsByExtensions[extension]) })
            OpenFileManager.newReadFile(fileHandle);
        }
    });
}