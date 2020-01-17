import { app } from './App';
import { Point } from './Objects/Point';

export class GridManager {
  /**
   * Le point de référence de la grille est le point (10,10).
   * Si grille carrée: le côté du carré est de 50 unités. (-> ex de points:
   *      (60, 60), (60,10), (10,60), ...)
   * Si grille triangulaire: la base du triangle est de 50 unités, et le
   * triangle est équilatéral.
   * 		(-> Ex de points: (60, 10), ...)
   */

  // constructor() {
  //   window.addEventListener('grid-showing-changed', event => event.detail.newState ? this.show() : this.hide());
  //   window.addEventListener('grid-size-changed', event => this.setSize(event.detail.newSize));
  //   window.addEventListener('grid-type-changed', event => this.setType(event.detail.newType));
  // }

  // static show() {
  //   app.workspace.settings.set('isGridShown', true);
  //   window.dispatchEvent(new CustomEvent('workspace-settings-changed'));
  // }
  // static hide() {
  //   app.workspace.settings.set('isGridShown', false);
  //   window.dispatchEvent(new CustomEvent('workspace-settings-changed'));
  // }

  // static setSize(newSize) {
  //   app.workspace.settings.set('gridSize', newSize);
  //   window.dispatchEvent(new CustomEvent('workspace-settings-changed'));
  // }

  // static setType(newType) {
  //   if (!['square', 'triangle'].includes(newType)) {
  //     console.error('Type invalide');
  //     return;
  //   }
  //   app.workspace.settings.set('gridType', newType);
  //   window.dispatchEvent(new CustomEvent('workspace-settings-changed'));
  // }

  static getVisibleGridPoints(minPoint, maxPoint) {
    if (!app.workspace.settings.get('isGridShown')) return [];

    let ptList = [],
      size = app.workspace.settings.get('gridSize'),
      type = app.workspace.settings.get('gridType');
    if (type == 'square') {
      let t1 = Math.ceil((minPoint.x - 10) / (50 * size)),
        startX = 10 + t1 * 50 * size,
        t2 = Math.ceil((minPoint.y - 10) / (50 * size)),
        startY = 10 + t2 * 50 * size;
      for (let x = startX; x <= maxPoint.x; x += 50 * size) {
        for (let y = startY; y <= maxPoint.y; y += 50 * size) {
          ptList.push({ x: x, y: y });
        }
      }
    } else {
      //triangle
      let approx = 43.3012701892,
        t1 = Math.ceil((minPoint.x - 10) / (50 * size)),
        startX = 10 + t1 * 50 * size,
        t2 = Math.ceil((minPoint.y - 10) / (approx * 2 * size)),
        startY = 10 + t2 * approx * 2 * size;

      for (let x = startX; x <= maxPoint.x; x += 50 * size) {
        for (let y = startY; y <= maxPoint.y; y += approx * 2 * size) {
          ptList.push({ x: x, y: y });
        }
      }

      t1 = Math.ceil((minPoint.x - 10 - (50 * size) / 2) / (50 * size));
      startX = 10 + (50 * size) / 2 + t1 * 50 * size;
      t2 = Math.ceil((minPoint.y - 10 - approx * size) / (approx * 2 * size));
      startY = 10 + approx * size + t2 * approx * 2 * size;
      for (let x = startX; x <= maxPoint.x; x += 50 * size) {
        for (let y = startY; y <= maxPoint.y; y += approx * 2 * size) {
          ptList.push({ x: x, y: y });
        }
      }
    }
    return ptList;
  }

  /**
   * Renvoie le point de la grille le plus proche d'un point.
   * @param  {Point} point Le point
   * @return {Point}       Un point de la grille
   */
  static getClosestGridPoint(point) {
    let x = point.x,
      y = point.y,
      possibilities = [],
      gridType = app.workspace.settings.get('gridType'),
      gridSize = app.workspace.settings.get('gridSize');

    if (gridType == 'square') {
      let topleft = new Point(x - ((x - 10) % (50 * gridSize)), y - ((y - 10) % (50 * gridSize)));
      possibilities.push(topleft);
      possibilities.push(topleft.addCoordinates(0, 50 * gridSize));
      possibilities.push(topleft.addCoordinates(50 * gridSize, 0));
      possibilities.push(topleft.addCoordinates(50 * gridSize, 50 * gridSize));
    } else {
      //triangle
      let height = 43.3012701892,
        topY = y - ((y - 10) % (height * gridSize)),
        topX =
          x -
          ((x - 10) % (50 * gridSize)) +
          (Math.round(topY / height / gridSize) % 2) * 25 * gridSize;
      if (topX > x) topX -= 50 * gridSize;
      let topleft1 = new Point(topX, topY);

      possibilities.push(topleft1);
      possibilities.push(topleft1.addCoordinates(50 * gridSize, 0));
      possibilities.push(topleft1.addCoordinates(25 * gridSize, height * gridSize));
    }

    const closest = possibilities.sort((poss1, poss2) =>
      point.dist(poss1) > point.dist(poss2) ? 1 : -1,
    )[0];

    closest.type = 'grid';

    return closest;
  }
}
