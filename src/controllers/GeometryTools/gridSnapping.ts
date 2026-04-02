import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 * Snaps coordinates to the grid if the grid is shown and snapping is possible.
 * @param coordinates - The coordinates to snap.
 * @returns The snapped coordinates or the original coordinates if snapping failed or is disabled.
 */
export function snapCoordinatesToGrid(coordinates: Coordinates | { x: number; y: number }): Coordinates {
  if (!coordinates) {
    console.warn('snapCoordinatesToGrid: Coordonnees non fournies');
    return new Coordinates({ x: 0, y: 0 });
  }

  if (!app || !app.settings) {
    console.warn('snapCoordinatesToGrid: Application ou parametres non disponibles');
    return new Coordinates(coordinates);
  }

  // @ts-ignore - app.gridCanvasLayer might be missing in types but exists in runtime
  if (app.settings.gridShown && app.gridCanvasLayer) {
    try {
      const coordinatesInCanvasSpace = new Coordinates(coordinates).toCanvasCoordinates();

      // @ts-ignore
      const gridPointInCanvasSpace = app.gridCanvasLayer.getClosestGridPoint(coordinatesInCanvasSpace);

      if (gridPointInCanvasSpace) {
        const gridPointInWorldSpace = gridPointInCanvasSpace.fromCanvasCoordinates();
        return new Coordinates(gridPointInWorldSpace);
      }
    } catch (error) {
      console.error('Erreur lors du snap sur la grille:', error);
    }
  }

  return new Coordinates(coordinates);
}
