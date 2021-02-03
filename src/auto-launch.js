import { setState } from './Core/App';
import { Environment } from './Core/Environments/Environment';

export const environmentsByExtensions = {
    'agg': 'Grandeurs',
    'agt': 'Tangram',
    'agc': 'Cubes',
    'agl': 'Geometrie'
}

if ('launchQueue' in window) {
    window.launchQueue.setConsumer(launchParams => {
        console.log('launch')
        // Nothing to do when the queue is empty.
        if (!launchParams.files.length) {
            return;
        }

        for (const fileHandle of launchParams.files) {
            const pathArray = fileHandle.name.split('.')
            const extension = pathArray[pathArray.length - 1]
            console.log(environmentsByExtensions[extension])
            setState({
                environnement: new Environment(environmentsByExtensions[extension]),
                fileToOpen: fileHandle
            })
        }
    });
}