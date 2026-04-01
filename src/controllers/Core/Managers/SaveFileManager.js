import { createTikzBlob } from '@services/TikzExportService';
import { appActions } from '@store/appState';
import { gridStore } from '@store/gridStore';
import { kit } from '@store/kit';
import { tools } from '@store/tools';
import { app } from '../App';
import { createElem } from '../Tools/general';
import { FullHistoryManager } from './FullHistoryManager';

const hasNativeFS = 'showSaveFilePicker' in window;

/**
 * Propriétés temporaires à supprimer des settings avant la sauvegarde
 */
const TEMPORARY_SETTINGS_PROPERTIES = [
  'numberOfDivisionParts',
  'numberOfRegularPoints',
  'shapesDrawColor',
  'shapeOpacity',
  'scalarNumerator',
  'scalarDenominator',
];

/**
 * Nettoie les propriétés temporaires des settings
 */
const cleanTemporarySettings = (settings) => {
  if (!settings) return settings;

  const cleanedSettings = { ...settings };
  TEMPORARY_SETTINGS_PROPERTIES.forEach((prop) => {
    delete cleanedSettings[prop];
  });

  return cleanedSettings;
};

/**
 * Configure les options de sauvegarde selon l'environnement
 */
const configureSaveOptions = (environment, tangram, fileName) => {
  const baseOptions = {
    suggestedName: fileName || 'sans-titre',
    types: [],
  };

  if (environment.name === 'Tangram') {
    if (!tangram.isSilhouetteShown) {
      baseOptions.types.push({
        description: `Silhouette (*${environment.extensions[1]})`,
        accept: { 'application/agmobile': [environment.extensions[1]] },
      });
    } else {
      baseOptions.types.push({
        description: `État (*${environment.extensions[0]})`,
        accept: { 'application/agmobile': [environment.extensions[0]] },
      });
    }
  } else {
    baseOptions.types.push({
      description: `État de l'application (*${environment.extensions[0]})`,
      accept: { 'application/agmobile': environment.extensions },
    });
  }

  baseOptions.types.push(
    {
      description: 'Image matricielle (*.png)',
      accept: { 'image/png': ['.png'] },
    },
    {
      description: 'Image vectorielle (*.svg)',
      accept: { 'image/svg+xml': ['.svg'] },
    },
    {
      description: 'Code TikZ pour LaTeX (*.tikz)',
      accept: { 'text/x-tikz': ['.tikz'] },
    },
  );

  return baseOptions;
};

const prepareTangramData = (app, saveData, toolsVisibility) => {
  const translateTool = toolsVisibility.find(
    (tool) => tool.name === 'translate',
  );
  if (translateTool) {
    translateTool.isVisible = false;
  }

  if (app.tangram.level) {
    saveData.tangramLevelSelected = app.tangram.level;
  }
};

const validateAppState = (app) => {
  if (!app.environment) {
    console.error(
      "L'environnement n'est pas chargé, la sauvegarde est annulée.",
    );
    appActions.addNotification({ message: "Erreur : L'environnement n'est pas prêt.", type: 'error' });
    return false;
  }

  if (app.environment.kit && !kit.get()) {
    console.error(
      "Le kit de formes requis n'est pas chargé, la sauvegarde est annulée.",
    );
    appActions.addNotification({
      message: "Erreur : Le kit de formes requis n'est pas chargé.",
      type: 'error',
    });
    return false;
  }

  return true;
};

const prepareFamiliesVisibility = (app) => {
  if (!app.environment.kit) return [];

  const currentKit = kit.get();
  return currentKit.families.map((family) => ({
    name: family.name,
    isVisible: family.isVisible,
  }));
};

const applyPermanentHide = (workspaceData, permanentHide) => {
  if (!permanentHide) return;

  workspaceData.objects.shapesData.forEach((sData) => {
    if (sData.geometryObject?.geometryIsHidden) {
      sData.geometryObject.geometryIsPermanentHidden = true;
    }
  });
};

const prepareSaveData = (
  app,
  workspace,
  { saveHistory, permanentHide, saveSettings },
) => {
  FullHistoryManager.cleanHisto();

  if (!validateAppState(app)) {
    return null;
  }

  const workspaceData = { ...workspace.data };
  const settings = saveSettings
    ? cleanTemporarySettings({ ...app.settings })
    : undefined;

  if (typeof gridStore !== 'undefined') {
    const gridState = gridStore.getState();
    if (settings) {
      settings.gridType = gridState.gridType;
      settings.gridSize = gridState.gridSize;
      settings.gridOpacity = gridState.gridOpacity;
      settings.gridShown = gridState.isVisible;
    }
  }

  const history = saveHistory ? { ...app.history } : undefined;
  const fullHistory = saveHistory ? { ...app.fullHistory } : undefined;

  const toolsVisibility = tools.get().map((tool) => ({
    name: tool.name,
    isVisible: tool.isVisible,
  }));

  const familiesVisibility = prepareFamiliesVisibility(app);

  applyPermanentHide(workspaceData, permanentHide);

  const saveData = {
    appVersion: app.version,
    timestamp: Date.now(),
    envName: app.environment.name,
    workspaceData,
    settings,
    fullHistory,
    history,
    toolsVisibility,
    familiesVisibility,
  };

  if (app.environment.name === 'Tangram') {
    prepareTangramData(app, saveData, toolsVisibility);
  }

  return saveData;
};

const writeFileNative = async (fileHandle, contents) => {
  const writer = await fileHandle.createWritable();
  await writer.truncate(0);
  await writer.write(contents);
  await writer.close();
};

const downloadFileFallback = (filename, dataUrl) => {
  const downloader = document.createElement('a');
  downloader.href = dataUrl;
  downloader.download = filename;
  downloader.target = '_blank';
  document.body.appendChild(downloader);
  downloader.click();
  document.body.removeChild(downloader);
};

const saveStateToFile = (handle, saveData, environment) => {
  const jsonData = JSON.stringify(saveData);
  const mimeType =
    environment.name === 'Tangram'
      ? 'application/agmobile'
      : 'application/json';
  const file = new Blob([jsonData], { type: mimeType });

  if (hasNativeFS) {
    writeFileNative(handle, file);
  } else {
    const dataUrl = window.URL.createObjectURL(file);
    downloadFileFallback(handle.name, dataUrl);
  }
  appActions.setStepSinceSave(false);
};

const saveToJson = async (saveData, options, environment, handle = null) => {
  try {
    const jsonData = JSON.stringify(saveData, null, 2);
    const mimeType =
      environment.name === 'Tangram'
        ? 'application/agmobile'
        : 'application/json';
    const extension = environment.extensions[0];

    const fileName = options.suggestedName.includes('.')
      ? options.suggestedName.replace(/\.[^/.]+$/, extension)
      : `${options.suggestedName}${extension}`;

    const file = new Blob([jsonData], { type: mimeType });

    if (hasNativeFS && !handle) {
      handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: `État de l'application (*${extension})`,
            accept: { [mimeType]: [extension] },
          },
        ],
      });
    }

    if (handle) {
      if (hasNativeFS) {
        await writeFileNative(handle, file);
      } else {
        const dataUrl = window.URL.createObjectURL(file);
        downloadFileFallback(fileName, dataUrl);
      }
    }

    appActions.setStepSinceSave(false);
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      return false;
    }
    console.error('Erreur lors de la sauvegarde JSON:', error);
    throw error;
  }
};

const saveToPng = async (app, saveData, options, handle = null) => {
  try {
    const {
      invisibleCanvasLayer,
      gridCanvasLayer,
      tangramCanvasLayer,
      mainCanvasLayer,
    } = app;
    const ctx = invisibleCanvasLayer.ctx;
    const { canvas } = ctx;
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    if (gridCanvasLayer)
      ctx.drawImage(gridCanvasLayer.canvas, 0, 0, width, height);
    if (tangramCanvasLayer) {
      if (app.tangram.level > 2 && app.tangram.level < 5) {
        ctx.fillStyle = '#ff000020';
        ctx.fillRect(width / 2, 0, width, height);
      }
      ctx.drawImage(tangramCanvasLayer.canvas, width / 2, 0, width / 2, height);
    }
    ctx.drawImage(mainCanvasLayer.canvas, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );

    if (hasNativeFS && !handle) {
      handle = await window.showSaveFilePicker({
        suggestedName: options.suggestedName,
        types: options.types,
      });
    }

    if (handle) {
      if (hasNativeFS) {
        await writeFileNative(handle, blob);
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        downloadFileFallback(options.suggestedName, dataUrl);
      }
    }

    ctx.clearRect(0, 0, width, height);
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      return false;
    }
    console.error('Erreur lors de la sauvegarde PNG:', error);
    throw error;
  }
};

const saveToSvg = async (app, saveData, options, handle = null) => {
  try {
    const {
      invisibleCanvasLayer,
      gridCanvasLayer,
      tangramCanvasLayer,
      mainCanvasLayer,
    } = app;
    const ctx = invisibleCanvasLayer.ctx;
    const { canvas } = ctx;
    const { width, height } = canvas;

    const svgElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg',
    );
    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'white');
    svgElement.appendChild(rect);

    const imageData = canvas.toDataURL('image/png');
    const image = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'image',
    );
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', width);
    image.setAttribute('height', height);
    image.setAttribute('href', imageData);
    svgElement.appendChild(image);

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });

    if (hasNativeFS && !handle) {
      handle = await window.showSaveFilePicker({
        suggestedName: options.suggestedName,
        types: options.types,
      });
    }

    if (handle) {
      if (hasNativeFS) {
        await writeFileNative(handle, blob);
      } else {
        const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgData);
        downloadFileFallback(options.suggestedName, dataUrl);
      }
    }

    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      return false;
    }
    console.error('Erreur lors de la sauvegarde SVG:', error);
    throw error;
  }
};

const saveToTikz = async (app, saveData, options, handle = null) => {
  try {
    const blob = createTikzBlob(app);

    let fileName = options.suggestedName;
    if (!fileName.endsWith('.tikz')) {
      fileName = fileName.includes('.')
        ? fileName.replace(/\.[^/.]+$/, '.tikz')
        : `${fileName}.tikz`;
    }

    if (hasNativeFS && !handle) {
      handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Code TikZ pour LaTeX (*.tikz)',
            accept: { 'text/x-tikz': ['.tikz'] },
          },
        ],
      });
    }

    if (handle) {
      if (hasNativeFS) {
        await writeFileNative(handle, blob);
      } else {
        const dataUrl = window.URL.createObjectURL(blob);
        downloadFileFallback(fileName, dataUrl);
      }
    }

    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      return false;
    }
    console.error('Erreur lors de la sauvegarde TikZ:', error);
    throw error;
  }
};

const processSaveDirect = async (handle, app, detail, fileType) => {
  try {
    const options = { suggestedName: handle.name, types: [] };
    let success = false;

    switch (fileType) {
      case 'png':
        success = await saveToPng(app, null, options, handle);
        break;
      case 'svg':
        success = await saveToSvg(app, null, options, handle);
        break;
      case 'tikz':
        success = await saveToTikz(app, null, options, handle);
        break;
      default: {
        const saveData = prepareSaveData(app, app.workspace, detail);
        if (saveData) {
          success = await saveToJson(saveData, options, app.environment);
        } else {
          return;
        }
        break;
      }
    }

    if (success) {
      appActions.setFilename(handle.name);
      appActions.setStepSinceSave(false);
      appActions.addNotification({ message: `Sauvegardé vers ${handle.name}.` });
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde directe:', error);
    appActions.addNotification({ message: `Erreur lors de la sauvegarde: ${error.message}`, type: 'error' });
  }
};

const processSave = async (handle, app, detail) => {
  try {
    const extension = handle.name.split('.').pop().toLowerCase();
    const options = { suggestedName: handle.name, types: [] };

    let success = false;
    switch (extension) {
      case 'png':
        success = await saveToPng(app, null, options, handle);
        break;
      case 'svg':
        success = await saveToSvg(app, null, options, handle);
        break;
      case 'tikz':
        success = await saveToTikz(app, null, options, handle);
        break;
      default: {
        const saveData = prepareSaveData(app, app.workspace, detail);
        if (saveData) {
          success = await saveToJson(
            saveData,
            options,
            app.environment,
            handle,
          );
        } else {
          return;
        }
        break;
      }
    }

    if (success) {
      appActions.setFilename(handle.name);
      appActions.setStepSinceSave(false);
      appActions.addNotification({ message: `Sauvegardé vers ${handle.name}.` });
    }
  } catch (error) {
    console.error('Erreur lors du traitement de la sauvegarde:', error);
    appActions.addNotification({ message: `Erreur lors de la sauvegarde: ${error.message}`, type: 'error' });
  }
};

export const saveFile = async (app, options = {}) => {
  try {
    if (
      app.environment.name === 'Tangram' &&
      app.workspace.data.backObjects.shapesData.length === 0
    ) {
      appActions.addNotification({ message: "Le puzzle est vide, il n'y a rien à sauvegarder." });
      return;
    }

    const saveOptions = configureSaveOptions(
      app.environment,
      app.tangram,
      options.fileName,
    );

    if (options.fileType && options.fileName) {
      const handle = { name: options.fileName };
      const detail = {
        saveHistory: options.saveHistory || false,
        permanentHide: options.permanentHide || false,
        saveSettings: options.saveSettings || true,
      };
      await processSaveDirect(handle, app, detail, options.fileType);
      return;
    }

    await import('@components/popups/save-popup');
    const popup = createElem('save-popup');
    popup.opts = saveOptions;

    popup.addEventListener('selected', async (event) => {
      let handle;
      if (hasNativeFS) {
        try {
          const saveOptionsNative = {
            suggestedName: event.detail.name,
            types: event.detail.types,
          };
          handle = await window.showSaveFilePicker(saveOptionsNative);
        } catch (error) {
          if (error.name === 'AbortError') {
            return;
          }
          console.error('Erreur lors de la sauvegarde du fichier :', error);
          appActions.addNotification({ message: 'Une erreur est survenue lors de la sauvegarde.', type: 'error' });
          return;
        }
      } else {
        handle = { ...event.detail };
      }

      if (handle) {
        processSave(handle, app, event.detail);
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la sauvegarde:", error);
    appActions.addNotification({ message: `Erreur lors de la sauvegarde: ${error.message}`, type: 'error' });
  }
};

export const initSaveFileEventListener = (app) => {
  window.addEventListener('save-file', () => {
    let fileName = app.filename;
    if (fileName) {
      const extensionIndex = fileName.lastIndexOf('.');
      if (extensionIndex !== -1)
        fileName = fileName.substring(0, extensionIndex);
    }
    saveFile(app, { fileName });
  });
};

export { configureSaveOptions, prepareSaveData, validateAppState };
