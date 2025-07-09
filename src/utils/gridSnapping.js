import { app } from '../controllers/Core/App';
import { Coordinates } from '../controllers/Core/Objects/Coordinates';

export function snapCoordinatesToGrid(coordinates) {
  if (app.settings.gridShown && app.gridCanvasLayer) {
    // Convertir les coordonnées en espace canvas pour getClosestGridPoint
    const coordinatesInCanvasSpace = new Coordinates(coordinates).toCanvasCoordinates();
    const gridPointInCanvasSpace = app.gridCanvasLayer.getClosestGridPoint(coordinatesInCanvasSpace);
    if (gridPointInCanvasSpace) {
      // Reconvertir le point de grille trouvé en espace monde
      const gridPointInWorldSpace = gridPointInCanvasSpace.fromCanvasCoordinates();
      return new Coordinates(gridPointInWorldSpace);
    }
  }
  return new Coordinates(coordinates);
}