import { createTikzBlob } from '@services/TikzExportService';
import { gridStore } from '@store/gridStore';
import { kit } from '@store/kit';
import { tools } from '@store/tools';
import { setState } from '../App';
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
 * @param {object} settings - Les settings à nettoyer
 * @returns {object} - Les settings nettoyés
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
 * @param {object} environment - L'environnement actuel
 * @param {object} tangram - L'état du jeu Tangram (optionnel)
 * @param {string} fileName - Le nom suggéré du fichier
 * @returns {object} - Les options de sauvegarde configurées
 */
const configureSaveOptions = (environment, tangram, fileName) => {
  const baseOptions = {
    suggestedName: fileName || 'sans-titre',
    types: [],
  };

  // Pour Tangram, gérer les options spéciales
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
    // Pour les autres environnements, utiliser leurs extensions spécifiques
    baseOptions.types.push({
      description: `État de l'application (*${environment.extensions[0]})`,
      accept: { 'application/agmobile': environment.extensions },
    });
  }

  // Ajouter toujours les options d'export image
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

/**
 * Prépare les données spécifiques à Tangram
 * @param {object} app - L'instance de l'application
 * @param {object} saveData - Les données de sauvegarde
 * @param {Array} toolsVisibility - La visibilité des outils
 */
const prepareTangramData = (app, saveData, toolsVisibility) => {
  // Désactiver l'outil de translation pour Tangram
  const translateTool = toolsVisibility.find(
    (tool) => tool.name === 'translate',
  );
  if (translateTool) {
    translateTool.isVisible = false;
  }

  // Ajouter le niveau Tangram si disponible
  if (app.tangram.level) {
    saveData.tangramLevelSelected = app.tangram.level;
  }
};

/**
 * Valide l'état de l'application avant la sauvegarde
 * @param {object} app - L'instance de l'application
 * @returns {boolean} - True si valide, false sinon
 */
const validateAppState = (app) => {
  if (!app.environment) {
    console.error(
      "L'environnement n'est pas chargé, la sauvegarde est annulée.",
    );
    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: { message: "Erreur : L'environnement n'est pas prêt." },
      }),
    );
    return false;
  }

  if (app.environment.kit && !kit.get()) {
    console.error(
      "Le kit de formes requis n'est pas chargé, la sauvegarde est annulée.",
    );
    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: {
          message: "Erreur : Le kit de formes requis n'est pas chargé.",
        },
      }),
    );
    return false;
  }

  return true;
};

/**
 * Prépare la visibilité des familles
 * @param {object} app - L'instance de l'application
 * @returns {Array} - La visibilité des familles
 */
const prepareFamiliesVisibility = (app) => {
  if (!app.environment.kit) return [];

  const currentKit = kit.get();
  return currentKit.families.map((family) => ({
    name: family.name,
    isVisible: family.isVisible,
  }));
};

/**
 * Applique le masquage permanent aux objets géométriques
 * @param {object} workspaceData - Les données du workspace
 * @param {boolean} permanentHide - Si le masquage doit être permanent
 */
const applyPermanentHide = (workspaceData, permanentHide) => {
  if (!permanentHide) return;

  workspaceData.objects.shapesData.forEach((sData) => {
    if (sData.geometryObject?.geometryIsHidden) {
      sData.geometryObject.geometryIsPermanentHidden = true;
    }
  });
};

/**
 * Prépare les données de l'application pour la sauvegarde.
 * @param {object} app - L'instance principale de l'application.
 * @param {object} workspace - L'espace de travail actuel.
 * @param {boolean} saveHistory - Indique si l'historique doit être inclus.
 * @param {boolean} permanentHide - Indique si les objets cachés doivent le rester de façon permanente.
 * @returns {object | null} - L'objet contenant les données de sauvegarde, ou null si des données essentielles manquent.
 */
const prepareSaveData = (
  app,
  workspace,
  { saveHistory, permanentHide, saveSettings },
) => {
  // Nettoyer l'historique complet
  FullHistoryManager.cleanHisto();

  // Validation de l'état de l'application
  if (!validateAppState(app)) {
    return null;
  }

  // Préparation des données de base
  const workspaceData = { ...workspace.data };
  const settings = saveSettings
    ? cleanTemporarySettings({ ...app.settings })
    : undefined;

  // Ajout des paramètres de grille si disponibles
  if (typeof gridStore !== 'undefined') {
    const gridState = gridStore.getState();
    if (settings) {
      settings.gridType = gridState.gridType;
      settings.gridSize = gridState.gridSize;
      settings.gridOpacity = gridState.gridOpacity;
      settings.gridShown = gridState.isVisible;
    }
  }

  // Préparation des données d'historique
  const history = saveHistory ? { ...app.history } : undefined;
  const fullHistory = saveHistory ? { ...app.fullHistory } : undefined;

  // Préparation de la visibilité des outils
  const toolsVisibility = tools.get().map((tool) => ({
    name: tool.name,
    isVisible: tool.isVisible,
  }));

  // Préparation de la visibilité des familles
  const familiesVisibility = prepareFamiliesVisibility(app);

  // Application du masquage permanent si demandé
  applyPermanentHide(workspaceData, permanentHide);

  // Construction de l'objet de sauvegarde
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

  // Préparation des données spécifiques à Tangram
  if (app.environment.name === 'Tangram') {
    prepareTangramData(app, saveData, toolsVisibility);
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
 * @param {object} environment - L'environnement actuel.
 */
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
  setState({ stepSinceSave: false });
};

/**
 * Sauvegarde les données JSON dans un fichier.
 * @param {object} saveData - Les données à sauvegarder.
 * @param {object} options - Les options de sauvegarde.
 * @param {object} environment - L'environnement actuel.
 * @param {FileSystemFileHandle} [handle] - Le handle du fichier (optionnel, pour éviter le doublon).
 * @returns {Promise<boolean>} - True si la sauvegarde a réussi.
 */
const saveToJson = async (saveData, options, environment, handle = null) => {
  try {
    const jsonData = JSON.stringify(saveData, null, 2);
    const mimeType =
      environment.name === 'Tangram'
        ? 'application/agmobile'
        : 'application/json';
    const extension = environment.extensions[0]; // Utiliser la première extension de l'environnement

    // Mettre à jour le nom du fichier avec la bonne extension
    const fileName = options.suggestedName.includes('.')
      ? options.suggestedName.replace(/\.[^/.]+$/, extension)
      : `${options.suggestedName}${extension}`;

    const file = new Blob([jsonData], { type: mimeType });

    if (hasNativeFS && !handle) {
      // Si pas de handle fourni, on demande à l'utilisateur
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

    setState({ stepSinceSave: false });
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      if (import.meta.env.DEV)
        console.log("Sauvegarde JSON annulée par l'utilisateur.");
      return false;
    }
    console.error('Erreur lors de la sauvegarde JSON:', error);
    throw error;
  }
};

/**
 * Sauvegarde le canvas principal en tant qu'image PNG.
 * @param {object} app - L'instance principale de l'application.
 * @param {object} saveData - Les données de sauvegarde (non utilisées pour PNG).
 * @param {object} options - Les options de sauvegarde.
 * @param {FileSystemFileHandle} [handle] - Le handle du fichier (optionnel, pour éviter le doublon).
 * @returns {Promise<boolean>} - True si la sauvegarde a réussi.
 */
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
      // Si pas de handle fourni, on demande à l'utilisateur
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
      if (import.meta.env.DEV)
        console.log("Sauvegarde PNG annulée par l'utilisateur.");
      return false;
    }
    console.error('Erreur lors de la sauvegarde PNG:', error);
    throw error;
  }
};

/**
 * Sauvegarde le canvas principal en tant qu'image SVG.
 * @param {object} app - L'instance principale de l'application.
 * @param {object} saveData - Les données de sauvegarde (non utilisées pour SVG).
 * @param {object} options - Les options de sauvegarde.
 * @param {FileSystemFileHandle} [handle] - Le handle du fichier (optionnel, pour éviter le doublon).
 * @returns {Promise<boolean>} - True si la sauvegarde a réussi.
 */
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

    // Créer un élément SVG
    const svgElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg',
    );
    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Ajouter un fond blanc
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'white');
    svgElement.appendChild(rect);

    // Convertir le canvas en image SVG (simplifié)
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
      // Si pas de handle fourni, on demande à l'utilisateur
      handle = await window.showSaveFilePicker({
        suggestedName: options.suggestedName,
        types: options.types,
      });
    }

    if (handle) {
      if (hasNativeFS) {
        await writeFileNative(handle, blob);
      } else {
        const dataUrl = encodeSvgForDataUrl(svgData);
        downloadFileFallback(options.suggestedName, dataUrl);
      }
    }

    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      if (import.meta.env.DEV)
        console.log("Sauvegarde SVG annulée par l'utilisateur.");
      return false;
    }
    console.error('Erreur lors de la sauvegarde SVG:', error);
    throw error;
  }
};

/**
 * Sauvegarde le contenu en tant que fichier TikZ.
 * @param {object} app - L'instance principale de l'application.
 * @param {object} saveData - Les données de sauvegarde (non utilisées pour TikZ).
 * @param {object} options - Les options de sauvegarde.
 * @param {FileSystemFileHandle} [handle] - Le handle du fichier (optionnel, pour éviter le doublon).
 * @returns {Promise<boolean>} - True si la sauvegarde a réussi.
 */
const saveToTikz = async (app, saveData, options, handle = null) => {
  try {
    const blob = createTikzBlob(app);

    // Mettre à jour le nom du fichier avec la bonne extension
    let fileName = options.suggestedName;
    if (!fileName.endsWith('.tikz')) {
      fileName = fileName.includes('.')
        ? fileName.replace(/\.[^/.]+$/, '.tikz')
        : `${fileName}.tikz`;
    }

    if (hasNativeFS && !handle) {
      // Si pas de handle fourni, on demande à l'utilisateur
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
      if (import.meta.env.DEV)
        console.log("Sauvegarde TikZ annulée par l'utilisateur.");
      return false;
    }
    console.error('Erreur lors de la sauvegarde TikZ:', error);
    throw error;
  }
};

/**
 * Traite la sauvegarde directement avec les options spécifiées (sans popup).
 * @param {object} handle - Le handle du fichier.
 * @param {object} app - L'instance principale de l'application.
 * @param {object} detail - Les détails de l'événement de sauvegarde.
 * @param {string} fileType - Le type de fichier.
 */
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
      setState({ filename: handle.name, stepSinceSave: false });
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: `Sauvegardé vers ${handle.name}.` },
        }),
      );
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde directe:', error);
    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: { message: `Erreur lors de la sauvegarde: ${error.message}` },
      }),
    );
  }
};

/**
 * Gère la sauvegarde après que l'utilisateur a sélectionné un fichier.
 * @param {FileSystemFileHandle | object} handle - Le handle du fichier.
 * @param {object} app - L'instance principale de l'application.
 * @param {object} detail - Les détails de l'événement de sauvegarde.
 */
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
      setState({ filename: handle.name, stepSinceSave: false });
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: `Sauvegardé vers ${handle.name}.` },
        }),
      );
    }
  } catch (error) {
    console.error('Erreur lors du traitement de la sauvegarde:', error);
    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: { message: `Erreur lors de la sauvegarde: ${error.message}` },
      }),
    );
  }
};

/**
 * Fonction principale pour initier la sauvegarde d'un fichier.
 * @param {object} app - L'instance principale de l'application.
 * @param {object} options - Les options de sauvegarde (optionnel).
 * @param {string} options.fileName - Le nom du fichier.
 * @param {string} options.fileType - Le type de fichier ('json', 'png', 'svg').
 * @param {boolean} options.saveHistory - Inclure l'historique.
 * @param {boolean} options.permanentHide - Masquer définitivement les objets cachés.
 * @param {boolean} options.saveSettings - Inclure les paramètres.
 */
export const saveFile = async (app, options = {}) => {
  try {
    // Validation spécifique à Tangram
    if (
      app.environment.name === 'Tangram' &&
      app.workspace.data.backObjects.shapesData.length === 0
    ) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: {
            message: "Le puzzle est vide, il n'y a rien à sauvegarder.",
          },
        }),
      );
      return;
    }

    // Configuration des options selon l'environnement
    const saveOptions = configureSaveOptions(
      app.environment,
      app.tangram,
      options.fileName,
    );

    // Si des options spécifiques sont fournies, on les utilise directement
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

    // Sinon, on utilise le système de popup
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
            if (import.meta.env.DEV)
              console.log("Sauvegarde annulée par l'utilisateur.");
            return;
          }
          console.error('Erreur lors de la sauvegarde du fichier :', error);
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: {
                message: 'Une erreur est survenue lors de la sauvegarde.',
              },
            }),
          );
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
    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: { message: `Erreur lors de la sauvegarde: ${error.message}` },
      }),
    );
  }
};

/**
 * Initialise le gestionnaire de sauvegarde en ajoutant un écouteur d'événements global.
 * @param {object} app - L'instance principale de l'application.
 */
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

// Export des fonctions utilitaires pour les tests
export { configureSaveOptions, prepareSaveData, validateAppState };

