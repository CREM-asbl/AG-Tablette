import { app } from './App';
import { WorkspaceManager } from './WorkspaceManager';

export class FileManager {
  static init() {
    window.addEventListener('file-opened', event => {
      if (event.detail.method == 'old') FileManager.oldOpenFile(event.detail.file);
      // new
      else FileManager.newOpenFile(event.detail.file);
    });
    window.addEventListener('open-file', () => {
      FileManager.openFile();
    });
    window.addEventListener('save-to-file', () => {
      FileManager.saveFile();
    });
  }

  static parseFile(data) {
    const dataObject = JSON.parse(data);

    if (dataObject.appSettings) app.settings.initFromObject(dataObject.appSettings);
    else app.resetSettings();

    WorkspaceManager.setWorkspaceFromJSON(data);
    window.dispatchEvent(new CustomEvent('app-settings-changed'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  static async newOpenFile(fileHandle) {
    const file = await fileHandle.getFile();
    const content = await file.text();
    FileManager.parseFile(content);
  }

  static oldOpenFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      FileManager.parseFile(reader.result);
    };
    reader.readAsText(file);
  }

  static async openFile() {
    if (window.chooseFileSystemEntries) {
      const opts = {
        accepts: [
          {
            extensions: ['agg', 'json'],
            mimeTypes: ['application/json'],
          },
        ],
      };
      try {
        let fileHandle = await window.chooseFileSystemEntries(opts);
        window.dispatchEvent(
          new CustomEvent('file-opened', { detail: { method: 'new', file: fileHandle } }),
        );
      } catch (error) {
        console.error(error);
        // user closed open prompt
      }
    } else {
      window.dispatchEvent(new CustomEvent('show-file-selector'));
    }
  }

  static saveToPng(handle) {
    const canvas = app.canvas.main;
    if (app.settings.get('hasNativeFS')) {
      // edge support for toBlob ?
      canvas.toBlob(blob => {
        FileManager.newWriteFile(handle, blob);
      });
    } else {
      const encoded_data = canvas.toDataURL();
      FileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static saveToSvg(handle) {
    const canvas = app.canvas.main;

    let svg_data =
      '<svg width="' +
      canvas.width +
      '" height="' +
      canvas.height +
      '" xmlns="http://www.w3.org/2000/svg" >\n';
    app.workspace.shapes.forEach(shape => {
      svg_data += shape.to_svg() + '\n';
    });
    svg_data += '</svg>';

    if (app.settings.get('hasNativeFS')) {
      FileManager.newWriteFile(handle, svg_data);
    } else {
      const encoded_data = 'data:image/svg+xml;base64,' + btoa(svg_data);
      FileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static saveState(handle, detail) {
    let { history, WSSettings, appSettings, ...saveObject } = {
      ...app.workspace.data,
      appSettings: app.settings.data,
    };

    if (detail.save_history) saveObject.history = history;
    // else saveObject.history = { history: [], historyIndex: -1 };

    if (detail.save_settings) saveObject.appSettings = appSettings;
    if (detail.save_settings) saveObject.WSSettings = WSSettings;

    let json_data = JSON.stringify(saveObject);

    if (app.settings.get('hasNativeFS')) {
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
          extensions: ['agg'],
          mimeTypes: ['text/json'],
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
        break;
      case 'svg':
        FileManager.saveToSvg(handle);
        break;
      case 'agg':
      case 'agt':
      case 'agc':
      case 'agl':
        window.addEventListener(
          'file-selected',
          event => {
            FileManager.saveState(handle, { ...event.detail });
          },
          { once: true },
        );
        window.dispatchEvent(new CustomEvent('show-save-popup'));
        break;
      default:
        console.error('unsupported file format: ', extension);
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
          case 'agg':
          case 'agt':
          case 'agc':
          case 'agl':
            FileManager.saveState(handle, detail);
            break;
          default:
            console.error('unsupported file format: ', extension);
        }
      },
      { once: true },
    );
    window.dispatchEvent(new CustomEvent('show-save-popup'));
  }

  static async newWriteFile(fileHandle, contents) {
    const writer = await fileHandle.createWriter();
    await writer.truncate(0);
    await writer.write(0, contents);
    await writer.close();
  }

  static async saveFile() {
    if (app.settings.get('hasNativeFS')) {
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
