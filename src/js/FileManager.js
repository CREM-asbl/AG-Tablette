import { app } from './App';

export class FileManager {
  constructor() {
    window.addEventListener('file-opened', event => {
      if (event.detail.method == 'old') this.oldOpenFile(event.detail.file);
      // new
      else this.newOpenFile(event.detail.file);
    });
    window.addEventListener('open-file', () => {
      this.openFile();
    });
    window.addEventListener('save-to-file', () => {
      this.saveFile();
    });
  }

  parseFile(data) {
    const dataObject = JSON.parse(data);

    if (dataObject.appSettings) app.settings.initFromObject(dataObject.appSettings);
    else app.resetSettings();

    app.wsManager.setWorkspaceFromJSON(data);
    window.dispatchEvent(new CustomEvent('app-settings-changed'));
    app.drawAPI.refreshUpper();
  }

  async newOpenFile(fileHandle) {
    const file = await fileHandle.getFile();
    const content = await file.text();
    this.parseFile(content);
  }

  oldOpenFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.parseFile(reader.result);
    };
    reader.readAsText(file);
  }

  async openFile() {
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

  saveToPng(handle) {
    if (app.hasNativeFS) {
      const canvas = app.drawAPI.canvas.main;

      // edge support for toBlob ?
      canvas.toBlob(blob => {
        this.newWriteFile(handle, blob);
      });
    } else {
      const ctx = app.drawAPI.canvas.main;
      const encoded_data = ctx.toDataURL();
      this.downloadFile(handle.name, encoded_data);
    }
  }

  saveToSvg(handle) {
    const ctx = app.drawAPI.canvas.main;

    let svg_data =
      '<svg width="' +
      ctx.width +
      '" height="' +
      ctx.height +
      '" xmlns="http://www.w3.org/2000/svg" >\n';
    app.workspace.shapes.forEach(shape => {
      svg_data += shape.to_svg() + '\n';
    });
    svg_data += '</svg>';

    if (app.hasNativeFS) {
      this.newWriteFile(handle, svg_data);
    } else {
      const encoded_data = 'data:image/svg+xml;base64,' + btoa(svg_data);
      this.downloadFile(handle.name, encoded_data);
    }
  }

  saveState(handle, detail) {
    let { history, WSSettings, appSettings, ...saveObject } = {
      ...app.workspace.data,
      appSettings: app.settings.data,
    };

    if (detail.save_history) saveObject.history = history;
    else saveObject.history = { history: [], historyIndex: -1 };

    if (detail.save_settings) saveObject.appSettings = appSettings;
    if (detail.save_settings) saveObject.WSSettings = WSSettings;

    let json_data = JSON.stringify(saveObject);

    if (app.hasNativeFS) {
      this.newWriteFile(handle, json_data);
    } else {
      const file = new Blob([json_data], { type: 'application/json' });
      const encoded_data = window.URL.createObjectURL(file);
      this.downloadFile(handle.name, encoded_data);
    }
  }

  getExtension(fileName) {
    return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
  }

  async newSaveFile() {
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
    const extension = this.getExtension(handle.name);
    switch (extension) {
      case 'png':
        this.saveToPng(handle);
        break;
      case 'svg':
        this.saveToSvg(handle);
        break;
      case 'agg':
      case 'agt':
      case 'agc':
      case 'agl':
        window.addEventListener(
          'file-selected',
          event => {
            this.saveState(handle, { ...event.detail });
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
  downloadFile(filename, encoded_data) {
    const downloader = document.createElement('a');
    downloader.href = encoded_data;
    downloader.download = filename;
    downloader.target = '_blank';
    document.body.appendChild(downloader);
    downloader.click();
    document.body.removeChild(downloader);
  }

  oldSaveFile() {
    window.addEventListener(
      'file-selected',
      event => {
        const handle = {
          ...event.detail,
        };
        let detail = { ...handle };
        const extension = this.getExtension(handle.name);
        switch (extension) {
          case 'png':
            this.saveToPng(handle);
            break;
          case 'svg':
            this.saveToSvg(handle);
            break;
          case 'agg':
          case 'agt':
          case 'agc':
          case 'agl':
            this.saveState(handle, detail);
            break;
          default:
            console.error('unsupported file format: ', extension);
        }
      },
      { once: true },
    );
    window.dispatchEvent(new CustomEvent('show-save-popup'));
  }

  async newWriteFile(fileHandle, contents) {
    const writer = await fileHandle.createWriter();
    await writer.truncate(0);
    await writer.write(0, contents);
    await writer.close();
  }

  async saveFile() {
    if (app.hasNativeFS) {
      try {
        await this.newSaveFile();
      } catch (error) {
        console.error(error);
        // user closed save prompt
      }
    } else {
      this.oldSaveFile();
    }
  }
}
