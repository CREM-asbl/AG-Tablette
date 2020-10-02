import { app } from '../App';
import { createElem } from '../Tools/general';

export class SaveFileManager {
  static async saveFile() {
    if (SaveFileManager.hasNativeFS) {
      try {
        await SaveFileManager.newSaveFile();
      } catch (error) {
        console.error(error);
        // user closed save prompt
      }
    } else {
      SaveFileManager.oldSaveFile();
    }
  }

  static async newSaveFile() {
    const opts = {
      type: 'save-file',
      accepts: [
        {
          description: 'Etat',
          extensions: [app.environment.extension],
          // mimeTypes: ['application/json'], // => cree un .json et pas .agg par exemple
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
    const extension = SaveFileManager.getExtension(handle.name);
    switch (extension) {
      case 'png':
        SaveFileManager.saveToPng(handle);
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: { message: 'Sauvegardé vers ' + handle.name + '.' },
          })
        );
        break;
      case 'svg':
        SaveFileManager.saveToSvg(handle);
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
            SaveFileManager.saveState(handle, { ...event.detail });
            window.dispatchEvent(
              new CustomEvent('show-notif', {
                detail: { message: 'Sauvegardé vers ' + handle.name + '.' },
              })
            );
          },
          { once: true }
        );
        import('../../popups/save-popup');
        createElem('save-popup');
    }
  }

  static oldSaveFile() {
    window.addEventListener(
      'file-selected',
      event => {
        const handle = {
          ...event.detail,
        };
        let detail = { ...handle };
        const extension = SaveFileManager.getExtension(handle.name);
        switch (extension) {
          case 'png':
            SaveFileManager.saveToPng(handle);
            break;
          case 'svg':
            SaveFileManager.saveToSvg(handle);
            break;
          default:
            SaveFileManager.saveState(handle, detail);
        }
      },
      { once: true }
    );
    import('../../popups/save-popup');
    createElem('save-popup');
  }

  static getExtension(fileName) {
    return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
  }

  static saveToPng(handle) {
    const ctx = app.invisibleCtx,
      canvas = app.canvas.invisible;
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

    if (SaveFileManager.hasNativeFS) {
      // edge support for toBlob ?
      canvas.toBlob(blob => {
        SaveFileManager.newWriteFile(handle, blob);
      });
    } else {
      const encoded_data = canvas.toDataURL();
      SaveFileManager.downloadFile(handle.name, encoded_data);
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  static saveToSvg(handle) {
    let svg_data = app.workspace.toSVG();

    if (SaveFileManager.hasNativeFS) {
      SaveFileManager.newWriteFile(handle, svg_data);
    } else {
      const encoded_data = 'data:image/svg+xml;base64,' + btoa(svg_data);
      SaveFileManager.downloadFile(handle.name, encoded_data);
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

    if (SaveFileManager.hasNativeFS) {
      SaveFileManager.newWriteFile(handle, json_data);
    } else {
      const file = new Blob([json_data], { type: 'application/json' });
      const encoded_data = window.URL.createObjectURL(file);
      SaveFileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static async newWriteFile(fileHandle, contents) {
    console.log(fileHandle);
    const writer = await fileHandle.createWritable();
    await writer.truncate(0);
    await writer.write(contents);
    await writer.close();
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
}

window.addEventListener('save-file', () => {
  SaveFileManager.saveFile();
});

// Si ancien ou nouveau systeme de fichier
SaveFileManager.hasNativeFS = 'chooseFileSystemEntries' in window;
