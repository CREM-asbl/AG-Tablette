import { app } from '../controllers/Core/App';
import { Coordinates } from '../controllers/Core/Objects/Coordinates';

export function snapCoordinatesToGrid(coordinates) {
  // Validation des paramètres d'entrée
  if (!coordinates) {
    console.warn('snapCoordinatesToGrid: Coordonnées non fournies');
    return new Coordinates({ x: 0, y: 0 });
  }

  if (!app || !app.settings) {
    console.warn('snapCoordinatesToGrid: Application ou paramètres non disponibles');
    return new Coordinates(coordinates);
  }

  if (app.settings.gridShown && app.gridCanvasLayer) {
    try {
      // Convertir les coordonnées en espace canvas pour getClosestGridPoint
      const coordinatesInCanvasSpace = new Coordinates(coordinates).toCanvasCoordinates();
      const gridPointInCanvasSpace = app.gridCanvasLayer.getClosestGridPoint(coordinatesInCanvasSpace);
      
      if (gridPointInCanvasSpace) {
        // Reconvertir le point de grille trouvé en espace monde
        const gridPointInWorldSpace = gridPointInCanvasSpace.fromCanvasCoordinates();
        return new Coordinates(gridPointInWorldSpace);
      }
    } catch (error) {
      console.error('Erreur lors du snap sur la grille:', error);
      // Retourner les coordonnées originales en cas d'erreur
    }
  }
  
  return new Coordinates(coordinates);
}