import { app } from '../controllers/Core/App';
import { Coordinates } from '../controllers/Core/Objects/Coordinates';

export function snapCoordinatesToGrid(coordinates) {
  if (app.settings.gridShown && app.gridCanvasLayer) {
    const gridPoint = app.gridCanvasLayer.getClosestGridPoint(coordinates);
    if (gridPoint) {
      return new Coordinates(gridPoint.coordinates);
    }
  }
  return new Coordinates(coordinates);
}