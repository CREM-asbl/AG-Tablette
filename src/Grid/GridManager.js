import { app } from '../Core/App';
import { Point } from '../Core/Objects/Point';

//Todo: Créer un event plus précis
addEventListener('app-state-changed', () => {
  if (app.state === 'grid') {
    import('./grid-popup');
    const popup = document.createElement('grid-popup');
    popup.style.display = 'block';
    document.querySelector('body').appendChild(popup);
  }
});

export class GridManager {
  static initState() {
    app.states.push({
      name: 'grid',
      title: 'Grille',
      type: 'tool',
    });
  }

  /**
   * Le point de référence de la grille est le point (10,10).
   * Si grille carrée: le côté du carré est de 50 unités. (-> ex de points:
   *      (60, 60), (60,10), (10,60), ...)
   * Si grille triangulaire: la base du triangle est de 50 unités, et le
   * triangle est équilatéral.
   * 		(-> Ex de points: (60, 10), ...)
   */
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
          ptList.push(new Point(x, y));
        }
      }
    } else if (type == 'horizontal-triangle') {
      let approx = 43.3012701892,
        t1 = Math.ceil((minPoint.x - 10) / (50 * size)),
        startX = 10 + t1 * 50 * size,
        t2 = Math.ceil((minPoint.y - 10) / (approx * 2 * size)),
        startY = 10 + t2 * approx * 2 * size;

      for (let x = startX; x <= maxPoint.x; x += 50 * size) {
        for (let y = startY; y <= maxPoint.y; y += approx * 2 * size) {
          ptList.push(new Point(x, y));
        }
      }

      t1 = Math.ceil((minPoint.x - 10 - (50 * size) / 2) / (50 * size));
      startX = 10 + (50 * size) / 2 + t1 * 50 * size;
      t2 = Math.ceil((minPoint.y - 10 - approx * size) / (approx * 2 * size));
      startY = 10 + approx * size + t2 * approx * 2 * size;
      for (let x = startX; x <= maxPoint.x; x += 50 * size) {
        for (let y = startY; y <= maxPoint.y; y += approx * 2 * size) {
          ptList.push(new Point(x, y));
        }
      }
    } else if (type == 'vertical-triangle') {
      let approx = 43.3012701892,
        t1 = Math.ceil((minPoint.x - 10) / (approx * 2 * size)),
        startX = 10 + t1 * approx * 2 * size,
        t2 = Math.ceil((minPoint.y - 10) / (50 * size)),
        startY = 10 + t2 * 50 * size;

      for (let x = startX; x <= maxPoint.x; x += approx * 2 * size) {
        for (let y = startY; y <= maxPoint.y; y += 50 * size) {
          ptList.push(new Point(x, y));
        }
      }

      t1 = Math.ceil((minPoint.x - 10 - approx * size) / (approx * 2 * size));
      startX = 10 + approx * size + t1 * approx * 2 * size;
      t2 = Math.ceil((minPoint.y - 10 - (50 * size) / 2) / (50 * size));
      startY = 10 + (50 * size) / 2 + t2 * 50 * size;
      for (let x = startX; x <= maxPoint.x; x += approx * 2 * size) {
        for (let y = startY; y <= maxPoint.y; y += 50 * size) {
          ptList.push(new Point(x, y));
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
      let topleft = new Point(
        x - ((x - 10) % (50 * gridSize)),
        y - ((y - 10) % (50 * gridSize))
      );
      possibilities.push(topleft);
      possibilities.push(topleft.addCoordinates(0, 50 * gridSize));
      possibilities.push(topleft.addCoordinates(50 * gridSize, 0));
      possibilities.push(topleft.addCoordinates(50 * gridSize, 50 * gridSize));
    } else if (gridType == 'horizontal-triangle') {
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
      possibilities.push(
        topleft1.addCoordinates(25 * gridSize, height * gridSize)
      );
    } else if (gridType == 'vertical-triangle') {
      let height = 43.3012701892,
        topX = x - ((x - 10) % (height * gridSize)),
        topY =
          y -
          ((y - 10) % (50 * gridSize)) +
          (Math.round(topX / height / gridSize) % 2) * 25 * gridSize;
      if (topY > y) topY -= 50 * gridSize;
      let topleft1 = new Point(topX, topY);

      possibilities.push(topleft1);
      possibilities.push(topleft1.addCoordinates(0, 50 * gridSize));
      possibilities.push(
        topleft1.addCoordinates(height * gridSize, 25 * gridSize)
      );
    }

    const closest = possibilities.sort((poss1, poss2) =>
      point.dist(poss1) > point.dist(poss2) ? 1 : -1
    )[0];

    closest.type = 'grid';

    return closest;
  }

  static toSVG() {
    let canvasWidth = app.canvas.main.clientWidth,
      canvasHeight = app.canvas.main.clientHeight,
      offsetX = app.workspace.translateOffset.x,
      offsetY = app.workspace.translateOffset.y,
      actualZoomLvl = app.workspace.zoomLevel,
      // Ne pas voir les points apparaître:
      marginToAdd = 0, //20 * actualZoomLvl,
      min = {
        x: -offsetX / actualZoomLvl - marginToAdd,
        y: -offsetY / actualZoomLvl - marginToAdd,
      },
      max = {
        x: (canvasWidth - offsetX) / actualZoomLvl + marginToAdd,
        y: (canvasHeight - offsetY) / actualZoomLvl + marginToAdd,
      },
      svg_data = '';

    let pts = GridManager.getVisibleGridPoints(min, max);
    pts.forEach(pt => {
      svg_data += pt.toSVG('#F00', 1.5);
    });

    if (svg_data !== '') svg_data = '<!-- Grid -->\n' + svg_data + '\n';

    return svg_data;
  }
}
