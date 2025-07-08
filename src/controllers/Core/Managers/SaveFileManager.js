import { kit } from '@store/kit';
import { tools } from '@store/tools';
import { setState } from '../App';
import { createElem } from '../Tools/general';
import { FullHistoryManager } from './FullHistoryManager';

const hasNativeFS = 'showSaveFilePicker' in window;

/**
 * Détermine les options de sauvegarde (nom suggéré, types de fichiers) en fonction de l'environnement.
 * @param {object} environment - L'environnement actuel de l'application.
 * @param {object} tangram - L'état du jeu Tangram.
 * @returns {object} - Les options pour la boîte de dialogue de sauvegarde.
 */
const configureSaveOptions = (environment, tangram) => {
  const options = {
    suggestedName: 'sans-titre',
    types: [
      {
        description: 'Image matricielle (*.png)',
        accept: { 'image/png': ['.png'] },
      },
      {
        description: 'Image vectorielle (*.svg)',
        accept: { 'image/svg+xml': ['.svg'] },
      },
    ],
  };

  if (environment.name === 'Tangram' && !tangram.isSilhouetteShown) {
    options.types.unshift({
      description: `Silhouette (*${environment.extensions[1]})`,
      accept: { 'application/agmobile': [environment.extensions[1]] },
    });
  } else {
    options.types.unshift({
      description: `État (*${environment.extensions[0]})`,
      accept: { 'application/agmobile': [environment.extensions[0]] },
    });
  }

  return options;
};

/**
 * Prépare les données de l'application pour la sauvegarde.
 * @param {object} app - L'instance principale de l'application.
 * @param {object} workspace - L'espace de travail actuel.
 * @param {boolean} saveHistory - Indique si l'historique doit être inclus.
 * @param {boolean} permanentHide - Indique si les objets cachés doivent le rester de façon permanente.
 * @returns {object | null} - L'objet contenant les données de sauvegarde, ou null si des données essentielles manquent.
 */
const prepareSaveData = (app, workspace, { saveHistory, permanentHide, saveSettings }) => {
  FullHistoryManager.cleanHisto();

  const workspaceData = { ...workspace.data };
  const settings = saveSettings ? { ...app.settings } : undefined;
  const history = saveHistory ? { ...app.history } : undefined;
  const fullHistory = saveHistory ? { ...app.fullHistory } : undefined;

  const toolsVisibility = tools.get().map(tool => ({ name: tool.name, isVisible: tool.isVisible }));
  if (app.environment.name === 'Tangram') {
    const translateTool = toolsVisibility.find(tool => tool.name === 'translate');
    if (translateTool) translateTool.isVisible = false;
  }

  // Vérifie si l'environnement est prêt pour la sauvegarde et si le kit est chargé si nécessaire
  if (!app.environment) {
    console.error("L'environnement n'est pas chargé, la sauvegarde est annulée.");
    window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: "Erreur : L'environnement n'est pas prêt." } }));
    return null;
  }

  if (app.environment.kit && !kit.get()) {
    console.error("Le kit de formes requis n'est pas chargé, la sauvegarde est annulée.");
    window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: "Erreur : Le kit de formes requis n'est pas chargé." } }));
    return null;
  }

  let familiesVisibility = [];
  if (app.environment.kit) {
    const currentKit = kit.get();
    familiesVisibility = currentKit.families.map(family => ({ name: family.name, isVisible: family.isVisible }));
  }

  if (permanentHide) {
    workspaceData.objects.shapesData.forEach(sData => {
      if (sData.geometryObject.geometryIsHidden) {
        sData.geometryObject.geometryIsPermanentHidden = true;
      }
    });
  }

  if (settings) {
    delete settings.numberOfDivisionParts;
    delete settings.numberOfRegularPoints;
    delete settings.shapesDrawColor;
    delete settings.shapeOpacity;
    delete settings.scalarNumerator;
    delete settings.scalarDenominator;
  }

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

  if (app.environment.name === 'Tangram' && app.tangram.level) {
    saveData.tangramLevelSelected = app.tangram.level;
  }

  return saveData;
};

/**
 * Écrit les données dans un fichier en utilisant l'API File System Access.
 * @param {FileSystemFileHandle} fileHandle - Le handle du fichier.
 * @param {Blob|string} contents - Le contenu à écrire.
 */
const writeFileNative = async (fileHandle, contents) => {
  const writer = await fileHandle.createWritable();
  await writer.truncate(0);
  await writer.write(contents);
  await writer.close();
};

/**
 * Déclenche le téléchargement d'un fichier pour les navigateurs sans API File System Access.
 * @param {string} filename - Le nom du fichier.
 * @param {string} dataUrl - L'URL des données à télécharger.
 */
const downloadFileFallback = (filename, dataUrl) => {
  const downloader = document.createElement('a');
  downloader.href = dataUrl;
  downloader.download = filename;
  downloader.target = '_blank';
  document.body.appendChild(downloader);
  downloader.click();
  document.body.removeChild(downloader);
};

/**
 * Sauvegarde l'état de l'application dans un fichier.
 * @param {FileSystemFileHandle | object} handle - Le handle du fichier ou un objet de remplacement.
 * @param {object} saveData - Les données de l'application à sauvegarder.
 */
const saveStateToFile = (handle, saveData) => {
  const jsonData = JSON.stringify(saveData);
  const file = new Blob([jsonData], { type: 'application/agmobile' });

  if (hasNativeFS) {
    writeFileNative(handle, file);
  } else {
    const dataUrl = window.URL.createObjectURL(file);
    downloadFileFallback(handle.name, dataUrl);
  }
  setState({ stepSinceSave: false });
};

/**
 * Sauvegarde le canvas principal en tant qu'image PNG.
 * @param {FileSystemFileHandle | object} handle - Le handle du fichier.
 * @param {object} app - L'instance principale de l'application.
 */
const saveToPng = (handle, app) => {
  const { invisibleCanvasLayer, gridCanvasLayer, tangramCanvasLayer, mainCanvasLayer } = app;
  const ctx = invisibleCanvasLayer.ctx;
  const { canvas } = ctx;
  const { width, height } = canvas;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  if (gridCanvasLayer) ctx.drawImage(gridCanvasLayer.canvas, 0, 0, width, height);
  if (tangramCanvasLayer) {
    if (app.tangram.level > 2 && app.tangram.level < 5) {
      ctx.fillStyle = "#ff000020";
      ctx.fillRect(width / 2, 0, width, height);
    }
    ctx.drawImage(tangramCanvasLayer.canvas, width / 2, 0, width / 2, height);
  }
  ctx.drawImage(mainCanvasLayer.canvas, 0, 0, width, height);

  if (hasNativeFS) {
    canvas.toBlob(blob => writeFileNative(handle, blob));
  } else {
    const dataUrl = canvas.toDataURL('image/png');
    downloadFileFallback(handle.name, dataUrl);
  }
  ctx.clearRect(0, 0, width, height);
};

/**
 * Encode les données SVG pour une utilisation dans une URL de données.
 * @param {string} svgData - Les données SVG brutes.
 * @returns {string} - L'URL de données encodée en Base64.
 */
const encodeSvgForDataUrl = (svgData) => {
  const symbols = /[\r\n%#()<>?\[\\\]^`{|}]/g;
  const encoded = svgData.replace(symbols, encodeURIComponent);
  return `data:image/svg+xml;base64,${btoa(encoded)}`;
};


/**
 * Sauvegarde l'espace de travail en tant qu'image vectorielle SVG.
 * @param {FileSystemFileHandle | object} handle - Le handle du fichier.
 * @param {object} workspace - L'espace de travail actuel.
 */
const saveToSvg = (handle, workspace) => {
  const svgData = workspace.toSVG();
  if (hasNativeFS) {
    writeFileNative(handle, svgData);
  } else {
    const dataUrl = encodeSvgForDataUrl(svgData);
    downloadFileFallback(handle.name, dataUrl);
  }
};

/**
 * Gère la sauvegarde après que l'utilisateur a sélectionné un fichier.
 * @param {FileSystemFileHandle | object} handle - Le handle du fichier.
 * @param {object} app - L'instance principale de l'application.
 * @param {object} detail - Les détails de l'événement de sauvegarde.
 */
const processSave = (handle, app, detail) => {
  const extension = handle.name.split('.').pop().toLowerCase();

  switch (extension) {
    case 'png':
      saveToPng(handle, app);
      break;
    case 'svg':
      saveToSvg(handle, app.workspace);
      break;
    default: {
      const saveData = prepareSaveData(app, app.workspace, detail);
      if (saveData) {
        saveStateToFile(handle, saveData);
      } else {
        // L'erreur est déjà notifiée dans prepareSaveData
        return;
      }
      break;
    }
  }
  window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: `Sauvegardé vers ${handle.name}.` } }));
};

/**
 * Fonction principale pour initier la sauvegarde d'un fichier.
 * @param {object} app - L'instance principale de l'application.
 */
export const saveFile = async (app) => {
  if (app.environment.name === 'Tangram' && app.workspace.data.backObjects.shapesData.length === 0) {
    // Ce message est ambigu. Il est déclenché lorsque le puzzle Tangram est vide.
    // Une meilleure formulation serait "Le puzzle est vide, il n'y a rien à sauvegarder."
    window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Le puzzle est vide.' } }));
    return;
  }

  const options = configureSaveOptions(app.environment, app.tangram);

  await import('@components/popups/save-popup');
  const popup = createElem('save-popup');
  popup.opts = options;

  popup.addEventListener('selected', async (event) => {
    let handle;
    if (hasNativeFS) {
      try {
        const saveOptions = {
          suggestedName: event.detail.name,
          types: event.detail.types,
        };
        handle = await window.showSaveFilePicker(saveOptions);
      } catch (error) {
        // Si l'erreur est une "AbortError", l'utilisateur a annulé la sauvegarde.
        if (error.name === 'AbortError') {
          console.log('Sauvegarde annulée par l-utilisateur.');
          return;
        }
        console.error('Erreur lors de la sauvegarde du fichier :', error);
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Une erreur est survenue lors de la sauvegarde.' } }));
        return;
      }
    } else {
      handle = { ...event.detail };
    }

    if (handle) {
      processSave(handle, app, event.detail);
    }
  });
};

/**
 * Initialise le gestionnaire de sauvegarde en ajoutant un écouteur d'événements global.
 * @param {object} app - L'instance principale de l'application.
 */
export const initSaveFileEventListener = (app) => {
  window.addEventListener('save-file', () => saveFile(app));
};
