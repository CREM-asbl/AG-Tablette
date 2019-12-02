import { app } from './App';

export class FileManager {
  static parseFile(data) {
    const dataObject = JSON.parse(data);
    if (dataObject.appSettings) {
      app.settings.initFromObject(dataObject.appSettings);
      dispatchEvent(new CustomEvent('app-settings-changed'));
    }
    app.wsManager.setWorkspaceFromJSON(data);
    app.drawAPI.refreshUpper();
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
            extensions: ['agg', 'fag', 'json'],
            mimeTypes: ['application/json'],
          },
        ],
      };
      try {
        let fileHandle = await window.chooseFileSystemEntries(opts);
        FileManager.newOpenFile(fileHandle);
      } catch {
        // user closed open prompt
      }
    } else {
      app.appDiv.shadowRoot.querySelector('#fileSelector').click();
    }
  }

  static saveToPng(handle) {
    if (app.hasNativeFS) {
      const canvas = app.drawAPI.canvas.main;

      // edge support for toBlob ?
      canvas.toBlob(blob => {
        FileManager.newWriteFile(handle, blob);
      });
    } else {
      const ctx = app.drawAPI.canvas.main;
      const encoded_data = ctx.toDataURL();
      FileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static saveToSvg(handle) {
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
      FileManager.newWriteFile(handle, svg_data);
    } else {
      const encoded_data = 'data:image/svg+xml;base64,' + btoa(svg_data);
      FileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static saveState(handle, detail) {
    let { history, settings, ...saveObject } = {
      ...app.workspace.data,
      settings: app.settings.data,
    };

    if (detail.save_history) saveObject.history = history;
    else saveObject.history = { history: [], historyIndex: -1 };

    if (detail.save_settings) saveObject.appSettings = settings;

    let json_data = JSON.stringify(saveObject);

    if (app.hasNativeFS) {
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
            if (event.detail) FileManager.saveState(handle, { ...event.detail });
          },
          { once: true },
        );
        app.appDiv.shadowRoot.querySelector('save-popup').style.display = 'block';
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
    app.appDiv.shadowRoot.querySelector('save-popup').style.display = 'block';
  }

  static async newWriteFile(fileHandle, contents) {
    const writer = await fileHandle.createWriter();
    await writer.truncate(0);
    await writer.write(0, contents);
    await writer.close();
  }

  static async saveFile() {
    if (app.hasNativeFS) {
      try {
        await FileManager.newSaveFile();
      } catch {
        // user closed save prompt
      }
    } else {
      FileManager.oldSaveFile();
    }
  }
}
