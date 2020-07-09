import { app } from '../App';
import { Settings } from '../Settings';
import { WorkspaceManager } from './WorkspaceManager';
import { createElem } from '../Tools/general';
import '../../popups/save-popup';
import '../../popups/open-popup';

export class FileManager {
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

  static async newReadFile(fileHandle) {
    const file = await fileHandle.getFile();
    const content = await file.text();
    FileManager.parseFile(content);
  }

  static oldReadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => FileManager.parseFile(reader.result);
    reader.readAsText(file);
  }

  static async openFile() {
    if (FileManager.hasNativeFS) {
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

  static saveToPng(handle) {
    const ctx = app.invisibleCtx,
      canvas = app.canvas.invisible;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(
      app.canvas.background,
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    ctx.drawImage(app.canvas.main, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(app.canvas.upper, 0, 0, ctx.canvas.width, ctx.canvas.height);

    if (FileManager.hasNativeFS) {
      // edge support for toBlob ?
      canvas.toBlob(blob => {
        FileManager.newWriteFile(handle, blob);
      });
    } else {
      const encoded_data = canvas.toDataURL();
      FileManager.downloadFile(handle.name, encoded_data);
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  static saveToSvg(handle) {
    let svg_data = app.workspace.toSVG();

    if (FileManager.hasNativeFS) {
      FileManager.newWriteFile(handle, svg_data);
    } else {
      const encoded_data = 'data:image/svg+xml;base64,' + btoa(svg_data);
      FileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static saveState(handle, detail) {
    let wsdata = app.workspace.data,
      appSettings = app.settings.saveToObject();

    if (!detail.save_history) wsdata.history = undefined;
    if (!detail.save_history) wsdata.completeHistory = undefined;

    if (!detail.save_settings) appSettings = undefined;
    if (!detail.save_settings) wsdata.settings = undefined;

    let silhouetteData;
    if (app.environment.name == 'Tangram')
      silhouetteData = app.silhouette.saveToObject();

    let saveObject = {
        appVersion: app.version,
        envName: app.environment.name,
        wsdata,
        appSettings,
        silhouetteData,
      },
      json_data = JSON.stringify(saveObject);

    if (FileManager.hasNativeFS) {
      FileManager.newWriteFile(handle, json_data);
    } else {
      const file = new Blob([json_data], { type: 'application/json' });
      const encoded_data = window.URL.createObjectURL(file);
      FileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static getExtension(fileName) {
    return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
  }

  static async newSaveFile() {
    const opts = {
      type: 'saveFile',
      accepts: [
        {
          description: 'Etat',
          extensions: [app.environment.extension],
          mimeTypes: ['application/json'],
        },
        {
          description: 'Image',
          extensions: ['png'],
          mimeTypes: ['img/png'],
        },
        {
          description: 'Vectoriel',
          extensions: ['svg'],
          mimeTypes: ['image/svg+xml'],
        },
      ],
    };
    const handle = await window.chooseFileSystemEntries(opts);
    const extension = FileManager.getExtension(handle.name);
    switch (extension) {
      case 'png':
        FileManager.saveToPng(handle);
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: { message: 'Sauvegardé vers ' + handle.name + '.' },
          })
        );
        break;
      case 'svg':
        FileManager.saveToSvg(handle);
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: { message: 'Sauvegardé vers ' + handle.name + '.' },
          })
        );
        break;
      default:
        window.addEventListener(
          'file-selected',
          event => {
            FileManager.saveState(handle, { ...event.detail });
            window.dispatchEvent(
              new CustomEvent('show-notif', {
                detail: { message: 'Sauvegardé vers ' + handle.name + '.' },
              })
            );
          },
          { once: true }
        );
        createElem('save-popup');
    }
  }

  /**
   * download a file to the user
   * @param {*} filename
   * @param {*} encoded_data
   */
  static downloadFile(filename, encoded_data) {
    const downloader = document.createElement('a');
    downloader.href = encoded_data;
    downloader.download = filename;
    downloader.target = '_blank';
    document.body.appendChild(downloader);
    downloader.click();
    document.body.removeChild(downloader);
  }

  static oldSaveFile() {
    window.addEventListener(
      'file-selected',
      event => {
        const handle = {
          ...event.detail,
        };
        let detail = { ...handle };
        const extension = FileManager.getExtension(handle.name);
        switch (extension) {
          case 'png':
            FileManager.saveToPng(handle);
            break;
          case 'svg':
            FileManager.saveToSvg(handle);
            break;
          default:
            FileManager.saveState(handle, detail);
        }
      },
      { once: true }
    );
    createElem('save-popup');
  }

  static async newWriteFile(fileHandle, contents) {
    const writer = await fileHandle.createWriter();
    await writer.truncate(0);
    await writer.write(0, contents);
    await writer.close();
  }

  static async saveFile() {
    if (FileManager.hasNativeFS) {
      try {
        await FileManager.newSaveFile();
      } catch (error) {
        console.error(error);
        // user closed save prompt
      }
    } else {
      FileManager.oldSaveFile();
    }
  }
}

window.addEventListener('file-opened', event => {
  if (event.detail.method == 'old') FileManager.oldReadFile(event.detail.file);
  else FileManager.newReadFile(event.detail.file);
});

window.addEventListener('open-file', () => {
  createElem('open-popup');
});

window.addEventListener('LocalOpenFile', () => {
  FileManager.openFile();
});

window.addEventListener('save-to-file', () => {
  FileManager.saveFile();
});

// Si ancien ou nouveau systeme de fichier
FileManager.hasNativeFS = 'chooseFileSystemEntries' in window;
