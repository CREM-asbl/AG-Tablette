import { app } from '../App';
import { Settings } from '../Settings';
import { WorkspaceManager } from './WorkspaceManager';
import { createElem } from '../Tools/general';
import '../../popups/open-popup';

export class OpenFileManager {
  static async openFile() {
    if (OpenFileManager.hasNativeFS) {
      const opts = {
        accepts: [
          {
            extensions: [app.environment.extension],
          },
        ],
      };
      try {
        let fileHandle = await window.chooseFileSystemEntries(opts);
        window.dispatchEvent(
          new CustomEvent('file-opened', {
            detail: { method: 'new', file: fileHandle },
          })
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

  static parseFile(data) {
    let dataObject;
    if (typeof data == 'string') {
      dataObject = JSON.parse(data);
    } else {
      dataObject = data;
    }

    app.lastFileVersion = dataObject.appVersion;

    if (dataObject.appSettings) {
      app.settings.initFromObject(dataObject.appSettings);
      if (app.lastFileVersion == '1.0.0') {
        for (let [key, value] of Object.entries(app.settings.data)) {
          app.settings.data[key] = value.value;
        }
      }
      app.initNonEditableSettings();
    } else app.resetSettings();

    if (app.lastFileVersion == '1.0.0') {
      dataObject.settings = new Settings();
      for (let [key, value] of Object.entries(dataObject.WSSettings)) {
        dataObject.settings[key] = value.value;
      }
      WorkspaceManager.setWorkspaceFromObject(dataObject);
    } else {
      WorkspaceManager.setWorkspaceFromObject(dataObject.wsdata);
    }
    window.dispatchEvent(
      new CustomEvent('file-parsed', { detail: dataObject })
    );
    window.dispatchEvent(new CustomEvent('app-settings-changed'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }
}

window.addEventListener('file-opened', event => {
  if (event.detail.method == 'old')
    OpenFileManager.oldReadFile(event.detail.file);
  else OpenFileManager.newReadFile(event.detail.file);
});

window.addEventListener('open-file', () => {
  createElem('open-popup');
});

window.addEventListener('LocalOpenFile', () => {
  OpenFileManager.openFile();
});

// Si ancien ou nouveau systeme de fichier
OpenFileManager.hasNativeFS = 'chooseFileSystemEntries' in window;
