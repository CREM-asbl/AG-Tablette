import { app } from '../App';
import { createElem } from '../Tools/general';

export class SaveFileManager {
  static async saveFile(actionAfter) {
    window.removeEventListener('new-window', SaveFileManager.actionAfterNewWindow);
    window.removeEventListener('open-file', SaveFileManager.actionAfterOpenFile);
    if (actionAfter == 'new') {
      window.addEventListener('show-notif', SaveFileManager.actionAfterNewWindow
      , {once: true});
    } else if (actionAfter == 'open') {
      window.addEventListener('show-notif', SaveFileManager.actionAfterOpenFile
      , {once: true});
    }
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

  static actionAfterNewWindow(event) {
    if (event.detail.message.startsWith('Sauvegardé'))
      window.dispatchEvent(new CustomEvent('new-window'));
  }

  static actionAfterOpenFile(event) {
    if (event.detail.message.startsWith('Sauvegardé'))
      window.dispatchEvent(new CustomEvent('open-file'));
  }

  static async newSaveFile() {
    const opts = {
      types: [
        {
          description: 'Etat',
          accept: {
            'application/agmobile': ['.' + app.environment.extension],
          },
        },
        {
          description: 'Image matricielle (png)',
          accept: {
            'img/png': ['.png'],
          },
        },
        {
          description: 'Image vectorielle (svg)',
          accept: {
            'image/svg+xml': ['.svg'],
          },
        },
      ],
    };
    const handle = await window.showSaveFilePicker(opts);
    const extension = SaveFileManager.getExtension(handle.name);
    SaveFileManager.extension = extension;
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
        if (event.detail.name === undefined) return;
        const handle = {
          ...event.detail,
        };
        let detail = { ...handle };
        const extension = SaveFileManager.getExtension(handle.name);
        SaveFileManager.extension = extension;
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
    const ctx = app.invisibleDrawingEnvironment.ctx,
      canvas = ctx.canvas,
      width = canvas.width,
      height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // pour avoir un fond blanc, si transparent, enlever les 3 prochaines lignes
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(
      app.backgroundDrawingEnvironment.ctx.canvas,
      0,
      0,
      width,
      height
    );
    ctx.drawImage(app.mainDrawingEnvironment.ctx.canvas, 0, 0, width, height);

    let forbiddenCanvas = document.body.querySelector('forbidden-canvas');
    if (forbiddenCanvas != null) {
      ctx.fillStyle = '#ff000033';
      ctx.fillRect(width / 2, 0, width / 2, height);
    }

    if (SaveFileManager.hasNativeFS) {
      // edge support for toBlob ?
      canvas.toBlob(blob => {
        SaveFileManager.newWriteFile(handle, blob);
      });
    } else {
      const encoded_data = canvas.toDataURL();
      SaveFileManager.downloadFile(handle.name, encoded_data);
    }
    ctx.clearRect(0, 0, width, height);
  }

  static saveToSvg(handle) {
    let svg_data = app.workspace.toSVG();

    if (SaveFileManager.hasNativeFS) {
      SaveFileManager.newWriteFile(handle, svg_data);
    } else {
      // should fix unicode encoding
      svg_data = encodeURIComponent(svg_data).replace(
        /%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
          return String.fromCharCode('0x' + p1);
        }
      );
      const encoded_data = 'data:image/svg+xml;base64,' + btoa(svg_data);
      SaveFileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static saveState(handle, detail) {
    let wsdata = app.workspace.data,
      appSettings = app.settings.saveToObject();

    SaveFileManager.saveHistory = detail.saveHistory;
    SaveFileManager.saveSettings = detail.saveSettings;

    if (!detail.saveHistory) wsdata.history = undefined;
    if (!detail.saveHistory) wsdata.completeHistory = undefined;

    if (!detail.saveSettings) appSettings = undefined;
    if (!detail.saveSettings) wsdata.settings = undefined;

    let silhouetteData;
    if (app.environment.name == 'Tangram' && app.silhouette)
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
      const file = new Blob([json_data], { type: 'application/agmobile' });
      const encoded_data = window.URL.createObjectURL(file);
      SaveFileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static async newWriteFile(fileHandle, contents) {
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

window.addEventListener('save-file', event => {
  console.log(event);
  SaveFileManager.saveFile(event.detail?.actionAfter);
});

// Si ancien ou nouveau systeme de fichier
SaveFileManager.hasNativeFS = 'showSaveFilePicker' in window;

SaveFileManager.saveSettings = true;
SaveFileManager.saveHistory = true;
SaveFileManager.extension = 'agg';
