import { app, setState } from '../App';
import { createElem } from '../Tools/general';

export class OpenFileManager {
  static async openFile() {
    if (OpenFileManager.hasNativeFS) {
      const opts = {
        types: [
          {
            description: 'Etat',
            accept: {
              'app/json': ['.' + app.environment.extension],
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

  static async parseFile(fileContent) {
    let saveObject;
    if (typeof fileContent == 'string') {
      try {
        saveObject = JSON.parse(fileContent);
      } catch(e) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Impossible d\'ouvrir ce fichier.' } }));
        return;
      }
    } else {
      saveObject = fileContent;
    }

    if (saveObject.appVersion == '1.0.0') {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Impossible d\'ouvrir ce fichier. La version n\'est plus prise en charge.' } }));
      return;
    }

    if (saveObject.envName != app.environment.name) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Impossible d\'ouvrir ce fichier. C\'est un fichier ' + saveObject.envName + '.' } }));
      return;
    }

    // app.lastFileVersion = saveObject.appVersion;
    const WorkspaceManagerModule = await import('./WorkspaceManager.js');
    WorkspaceManagerModule.WorkspaceManager.setWorkspaceFromObject(saveObject.wsdata);
    if (app.environment.name == 'Tangram')
      app.mainCanvasLayer.removeAllObjects();

    if (saveObject.settings) {
      setState({ settings: { ...saveObject.settings } });
    } else {
      app.resetSettings();
    }

    if (saveObject.fullHistory) {
      setState({ fullHistory: { ...saveObject.fullHistory } });
    } else {
      setState({
        fullHistory: { ...app.defaultState.fullHistory },
      });
    }

    if (saveObject.history) {
      setState({ history: { ...saveObject.history } });
    } else {
      setState({
        history: {
          ...app.defaultState.history,
          startSituation: {
            ...app.workspace.data,
            tangram: {
              isSilhouetteShown: true,
              currentStep: 'start',
              buttonText: 'Vérifier solution',
              buttonValue: 'check',
            }
          },
          startSettings: { ...app.settings },
        },
      });
    }

    if (saveObject.toolsVisible) {
      saveObject.toolsVisible.forEach(toolVisible => app.tools.find(tool => tool.name == toolVisible.name).isVisible = toolVisible.isVisible)
      saveObject.familiesVisible.forEach(familyVisible => app.environment.families.find(family => family.name == familyVisible.name).isVisible = familyVisible.isVisible)
      setState({ tools: [...app.tools] });
    }

    window.dispatchEvent(
      new CustomEvent('file-parsed', { detail: saveObject }),
    );
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }
}

window.addEventListener('open-file', async () => {
  await import('../../popups/open-popup');
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
