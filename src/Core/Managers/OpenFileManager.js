import { app, setState } from '../App';
import { Settings } from '../Settings';
import { WorkspaceManager } from './WorkspaceManager';
import { createElem } from '../Tools/general';
import '../../popups/open-popup';

export class OpenFileManager {
  static async openFile() {
    if (OpenFileManager.hasNativeFS) {
      const opts = {
        types: [
          {
            description: 'Etat',
            accept: {
              'text/plain': ['.' + app.environment.extension],
            },
          },
        ],
      };
      try {
        const fileHandle = await window.showOpenFilePicker(opts);
        window.dispatchEvent(
          new CustomEvent('file-opened', {
            detail: { method: 'new', file: fileHandle },
          }),
        );
      } catch (error) {
        // user closed open prompt
        console.error(error);
      }
    } else {
      window.dispatchEvent(new CustomEvent('show-file-selector'));
    }
  }

  static async newReadFile(fileHandle) {
    const file = await fileHandle.getFile();
    const content = await file.text();
    OpenFileManager.parseFile(content);
  }

  static oldReadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => OpenFileManager.parseFile(reader.result);
    reader.readAsText(file);
  }

  static parseFile(fileContent) {
    let saveObject;
    if (typeof fileContent == 'string') {
      saveObject = JSON.parse(fileContent);
    } else {
      saveObject = fileContent;
    }

    app.lastFileVersion = saveObject.appVersion;
    WorkspaceManager.setWorkspaceFromObject(saveObject.wsdata);

    if (saveObject.settings) {
      setState({ settings: {...saveObject.settings}});
    } else app.resetSettings();

    if (saveObject.fullHistory)
    setState({ fullHistory: {...saveObject.fullHistory}});

    if (saveObject.history) {
      setState({ history: {...saveObject.history}});
    } else {
      setState(
        {
          history: {...app.defaultState.history, startSituation: {...app.workspace.data}, startSettings: {...app.settings}},
        }
      );
    }

    window.dispatchEvent(
      new CustomEvent('file-parsed', { detail: saveObject }),
    );
  }
}

window.addEventListener('open-file', () => {
  createElem('open-popup');
});

window.addEventListener('local-open-file', () => {
  OpenFileManager.openFile();
});

window.addEventListener('file-opened', (event) => {
  if (event.detail.method == 'old')
    OpenFileManager.oldReadFile(event.detail.file);
  else OpenFileManager.newReadFile(event.detail.file[0]);
});

window.addEventListener('parse-file', (event) => {
  OpenFileManager.parseFile(event.detail.fileContent);
});

// Si ancien ou nouveau systeme de fichier
OpenFileManager.hasNativeFS = 'showOpenFilePicker' in window;
