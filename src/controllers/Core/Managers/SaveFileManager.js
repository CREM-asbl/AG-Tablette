import { kit } from '@store/kit';
import { tools } from '@store/tools';
import { app, setState } from '../App';
import { createElem, getExtension } from '../Tools/general';
import { FullHistoryManager } from './FullHistoryManager';


export class SaveFileManager {
  static async saveFile() {
    if (app.environment.name == 'Tangram' && app.workspace.data.backObjects.shapesData.length == 0) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Certaines figures se superposent.' } }));
      return;
    }
    const opts = {
      suggestedName: 'sans titre',
      types: [
        {
          description: 'Image matricielle (*.png)',
          accept: {
            'img/png': ['.png'],
          },
        },
        {
          description: 'Image vectorielle (*.svg)',
          accept: {
            'image/svg+xml': ['.svg'],
          },
        },
      ],
    };
    if (app.environment.name == 'Tangram' && !app.tangram.isSilhouetteShown) {
      opts.types = [
        {
          description: `Silhouette (*${app.environment.extensions[1]})`,
          accept: {
            'application/agmobile': [app.environment.extensions[1]],
          },
        },
        ...opts.types
      ];
    }
    if (app.environment.name != 'Tangram' || app.tangram.isSilhouetteShown) {
      opts.types = [
        {
          description: `Etat (*${app.environment.extensions[0]})`,
          accept: {
            'application/agmobile': [app.environment.extensions[0]],
          },
        },
        ...opts.types
      ];
    }
    await import('@components/popups/save-popup');
    const popup = createElem('save-popup');
    popup.opts = opts
    popup.addEventListener('selected', async event => {
      let handle
      if (SaveFileManager.hasNativeFS) {
        try {
          opts.suggestedName = event.detail.name;
          opts.types = event.detail.types
          handle = await window.showSaveFilePicker(opts);
        } catch (error) {
          console.error(error);
          // user closed save prompt
        }
      } else {
        handle = { ...event.detail };
      }
      if (!handle) return
      const extension = getExtension(handle.name);
      SaveFileManager.extension = extension;
      switch (extension) {
        case 'png':
          SaveFileManager.saveToPng(handle);
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: { message: 'Sauvegardé vers ' + handle.name + '.' },
            }),
          );
          break;
        case 'svg':
          SaveFileManager.saveToSvg(handle);
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: { message: 'Sauvegardé vers ' + handle.name + '.' },
            }),
          );
          break;
        default:
          let saveResult = SaveFileManager.saveState(handle, { ...event.detail });
          if (saveResult != -1)
            window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Sauvegardé vers ' + handle.name + '.' } }))
      }
    })
  }

  static saveToPng(handle) {
    const ctx = app.invisibleCanvasLayer.ctx,
      canvas = ctx.canvas,
      width = canvas.width,
      height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // pour avoir un fond blanc, si transparent, enlever les 3 prochaines lignes
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    if (app.gridCanvasLayer)
      ctx.drawImage(app.gridCanvasLayer.canvas, 0, 0, width, height);
    if (app.tangramCanvasLayer) {
      if (app.tangram.level > 2 && app.tangram.level < 5) {
        ctx.fillStyle = "#ff000020";
        ctx.fillRect(width / 2, 0, width, height);
      }
      ctx.drawImage(app.tangramCanvasLayer.canvas, width / 2, 0, width / 2, height);
    }
    ctx.drawImage(app.mainCanvasLayer.canvas, 0, 0, width, height);

    if (SaveFileManager.hasNativeFS) {
      // edge support for toBlob ?
      canvas.toBlob((blob) => {
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
      svg_data = encodeURIComponent(svg_data).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
          return String.fromCharCode('0x' + p1);
        },
      );
      const encoded_data = 'data:image/svg+xml;base64,' + btoa(svg_data);
      SaveFileManager.downloadFile(handle.name, encoded_data);
    }
  }

  static saveState(handle, detail) {
    FullHistoryManager.cleanHisto();
    let wsdata = app.workspace.data,
      settings = { ...app.settings },
      history = detail.saveHistory ? { ...app.history } : undefined,
      fullHistory = detail.saveHistory ? { ...app.fullHistory } : undefined,
      toolsVisible = tools.get().map(tool => { return { name: tool.name, isVisible: tool.isVisible } }),
      familiesVisible = kit.get().families.map(family => { return { name: family.name, isVisible: family.isVisible } });

    if (detail.permanentHide) {
      wsdata.objects.shapesData.forEach(sData => {
        if (sData.geometryObject.geometryIsHidden)
          sData.geometryObject.geometryIsPermanentHidden = true;
      });
    }

    if (!detail.saveSettings) settings = undefined;
    else {
      delete settings.numberOfDivisionParts;
      delete settings.numberOfRegularPoints;
      delete settings.shapesDrawColor;
      delete settings.shapeOpacity;
      delete settings.scalarNumerator;
      delete settings.scalarDenominator;
    }

    if (app.environment.name == 'Tangram') toolsVisible.find(tool => tool.name == 'translate').isVisible = false;


    let saveObject = {
      appVersion: app.version,
      timestamp: Date.now(),
      envName: app.environment.name,
      wsdata,
      settings,
      fullHistory,
      history,
      toolsVisible,
      familiesVisible,
    }

    if (app.environment.name == 'Tangram' && app.tangram.level) {
      saveObject.tangramLevelSelected = app.tangram.level;
    }

    let json_data = JSON.stringify(saveObject);

    const file = new Blob([json_data], { type: 'application/agmobile' });
    if (SaveFileManager.hasNativeFS) {
      SaveFileManager.newWriteFile(handle, file);
    } else {
      const encoded_data = window.URL.createObjectURL(file);
      SaveFileManager.downloadFile(handle.name, encoded_data);
    }
    setState({ stepSinceSave: false });
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

window.addEventListener('save-file', (event) => {
  SaveFileManager.saveFile(event.detail?.actionAfter);
});

// Si ancien ou nouveau systeme de fichier
SaveFileManager.hasNativeFS = 'showSaveFilePicker' in window;

SaveFileManager.extension = 'agg';
