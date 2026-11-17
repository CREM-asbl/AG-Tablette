//ce fichier est un peu trop fourre-tout
//par exemple: faudrait séparer les fonctions sur le couleurs dans un autre fichier

import { app } from '../App.js';
import { layerOrder, objectTypeOrder } from './utils.js';

export * from './utils.js';

export function findObjectById(id) {
  if (!id) return;
  const layer = layerOrder[id[8]];
  const objectType = objectTypeOrder[id[9]];
  const object = app[layer + 'CanvasLayer'][objectType + 's'].find(
    (obj) => obj.id === id,
  );
  return object;
}

export function findIndexById(id) {
  if (!id) return -1;
  const layer = layerOrder[id[8]];
  const objectType = objectTypeOrder[id[9]];
  const index = app[layer + 'CanvasLayer'][objectType + 's'].findIndex(
    (obj) => obj.id === id,
  );
  return index;
}

export function findObjectsByName(name, layer, objectType = 'shape') {
  const objects = app[layer + 'CanvasLayer'][objectType + 's'].filter(
    (obj) => obj.name === name,
  );
  return objects;
}

export function removeObjectById(id) {
  if (!id) return -1;
  const objectType = objectTypeOrder[id[9]];
  const index = findIndexById(id, objectType);
  if (index === -1) return;
  const layer = layerOrder[id[8]];
  const object = app[layer + 'CanvasLayer'][objectType + 's'][index];
  if (objectType === 'shape') {
    object.segments.forEach((seg) => removeObjectById(seg.id));
    object.points.forEach((pt) => removeObjectById(pt.id));
  }
  app[layer + 'CanvasLayer'][objectType + 's'].splice(index, 1);
}

export function goToHomePage() {
  // Solution simple et robuste : recharger la page sans paramètres
  // Cela garantit que tout est correctement réinitialisé
  window.location = window.location.href.split('?')[0];
}
