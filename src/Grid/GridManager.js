import { app } from '../Core/App';
import { Point } from '../Core/Objects/Point';
import { Coordinates } from '../Core/Objects/Coordinates';

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
  static drawGridPoints() {
    if (!app.workspace.settings.get('isGridShown')) return [];

    const canvasWidth = app.canvasWidth,
      canvasHeight = app.canvasHeight,
      offsetX = app.workspace.translateOffset.x,
      offsetY = app.workspace.translateOffset.y,
      actualZoomLvl = app.workspace.zoomLevel,
      // Ne pas voir les points apparaître :
      marginToAdd = 20 * actualZoomLvl,
      minCoord = new Coordinates({
        x: -offsetX / actualZoomLvl - marginToAdd,
        y: -offsetY / actualZoomLvl - marginToAdd,
      }),
      maxCoord = new Coordinates({
        x: (canvasWidth - offsetX) / actualZoomLvl + marginToAdd,
        y: (canvasHeight - offsetY) / actualZoomLvl + marginToAdd,
      });

    let size = app.workspace.settings.get('gridSize'),
      type = app.workspace.settings.get('gridType');
    if (type == 'square') {
      let t1 = Math.ceil((minCoord.x - 10) / (50 * size)),
        startX = 10 + t1 * 50 * size,
        t2 = Math.ceil((minCoord.y - 10) / (50 * size)),
        startY = 10 + t2 * 50 * size;
      for (let x = startX; x <= maxCoord.x; x += 50 * size) {
        for (let y = startY; y <= maxCoord.y; y += 50 * size) {
          new Point({
            drawingEnvironment: app.backgroundDrawingEnvironment,
            x,
            y,
            color: '#F00',
            size: 1.5 * actualZoomLvl,
          });
        }
      }
    } else if (type == 'horizontal-triangle') {
      let approx = 43.3012701892,
        t1 = Math.ceil((minCoord.x - 10) / (50 * size)),
        startX = 10 + t1 * 50 * size,
        t2 = Math.ceil((minCoord.y - 10) / (approx * 2 * size)),
        startY = 10 + t2 * approx * 2 * size;

      for (let x = startX; x <= maxCoord.x; x += 50 * size) {
        for (let y = startY; y <= maxCoord.y; y += approx * 2 * size) {
          new Point({
            drawingEnvironment: app.backgroundDrawingEnvironment,
            x,
            y,
            color: '#F00',
            size: 1.5 * actualZoomLvl,
          });
        }
      }

      t1 = Math.ceil((minCoord.x - 10 - (50 * size) / 2) / (50 * size));
      startX = 10 + (50 * size) / 2 + t1 * 50 * size;
      t2 = Math.ceil((minCoord.y - 10 - approx * size) / (approx * 2 * size));
      startY = 10 + approx * size + t2 * approx * 2 * size;
      for (let x = startX; x <= maxCoord.x; x += 50 * size) {
        for (let y = startY; y <= maxCoord.y; y += approx * 2 * size) {
          new Point({
            drawingEnvironment: app.backgroundDrawingEnvironment,
            x,
            y,
            color: '#F00',
            size: 1.5 * actualZoomLvl,
          });
        }
      }
    } else if (type == 'vertical-triangle') {
      let approx = 43.3012701892,
        t1 = Math.ceil((minCoord.x - 10) / (approx * 2 * size)),
        startX = 10 + t1 * approx * 2 * size,
        t2 = Math.ceil((minCoord.y - 10) / (50 * size)),
        startY = 10 + t2 * 50 * size;

      for (let x = startX; x <= maxCoord.x; x += approx * 2 * size) {
        for (let y = startY; y <= maxCoord.y; y += 50 * size) {
          new Point({
            drawingEnvironment: app.backgroundDrawingEnvironment,
            x,
            y,
            color: '#F00',
            size: 1.5 * actualZoomLvl,
          });
        }
      }

      t1 = Math.ceil((minCoord.x - 10 - approx * size) / (approx * 2 * size));
      startX = 10 + approx * size + t1 * approx * 2 * size;
      t2 = Math.ceil((minCoord.y - 10 - (50 * size) / 2) / (50 * size));
      startY = 10 + (50 * size) / 2 + t2 * 50 * size;
      for (let x = startX; x <= maxCoord.x; x += approx * 2 * size) {
        for (let y = startY; y <= maxCoord.y; y += 50 * size) {
          new Point({
            drawingEnvironment: app.backgroundDrawingEnvironment,
            x,
            y,
            color: '#F00',
            size: 1.5 * actualZoomLvl,
          });
        }
      }
    }
  }

  /**
   * Renvoie la coordonnée du point de la grille le plus proche.
   * @param  {Coordinates} coord
   * @return {Point}
   */
  static getClosestGridPoint(coord) {
    let x = coord.x,
      y = coord.y,
      possibilities = [],
      gridType = app.workspace.settings.get('gridType'),
      gridSize = app.workspace.settings.get('gridSize');

    if (gridType == 'square') {
      let topleft = new Coordinates({
        x: x - ((x - 10) % (50 * gridSize)),
        y: y - ((y - 10) % (50 * gridSize)),
      });
      // closest point on top and left
      possibilities.push(topleft);
      possibilities.push(topleft.add({ x: 0, y: 50 * gridSize }));
      possibilities.push(topleft.add({ x: 50 * gridSize, y: 0 }));
      possibilities.push(topleft.add({ x: 50 * gridSize, y: 50 * gridSize }));
    } else if (gridType == 'horizontal-triangle') {
      let height = 43.3012701892,
        topY = y - ((y - 10) % (height * gridSize)),
        topX =
          x -
          ((x - 10) % (50 * gridSize)) +
          (Math.round(topY / height / gridSize) % 2) * 25 * gridSize;
      if (topX > x) topX -= 50 * gridSize;
      let topleft1 = new Coordinates({ x: topX, y: topY });

      possibilities.push(topleft1);
      possibilities.push(topleft1.add({ x: 50 * gridSize, y: 0 }));
      possibilities.push(
        topleft1.add({ x: 25 * gridSize, y: height * gridSize })
      );
    } else if (gridType == 'vertical-triangle') {
      let height = 43.3012701892,
        topX = x - ((x - 10) % (height * gridSize)),
        topY =
          y -
          ((y - 10) % (50 * gridSize)) +
          (Math.round(topX / height / gridSize) % 2) * 25 * gridSize;
      if (topY > y) topY -= 50 * gridSize;
      let topleft1 = new Coordinates({ x: topX, y: topY });

      possibilities.push(topleft1);
      possibilities.push(topleft1.add({ x: 0, y: 50 * gridSize }));
      possibilities.push(
        topleft1.add({ x: height * gridSize, y: 25 * gridSize })
      );
    }

    const closestCoord = possibilities.sort((poss1, poss2) =>
      coord.dist(poss1) > coord.dist(poss2) ? 1 : -1
    )[0];

    const closestPoint = app.backgroundDrawingEnvironment.points.find(pt =>
      pt.coordinates.equal(closestCoord)
    );
    closestPoint.type = 'grid';

    return closestPoint;
  }

  // static toSVG() {
  //   let canvasWidth = app.canvas.main.clientWidth,
  //     canvasHeight = app.canvas.main.clientHeight,
  //     offsetX = app.workspace.translateOffset.x,
  //     offsetY = app.workspace.translateOffset.y,
  //     actualZoomLvl = app.workspace.zoomLevel,
  //     // Ne pas voir les points apparaître:
  //     marginToAdd = 0, //20 * actualZoomLvl,
  //     min = {
  //       x: -offsetX / actualZoomLvl - marginToAdd,
  //       y: -offsetY / actualZoomLvl - marginToAdd,
  //     },
  //     max = {
  //       x: (canvasWidth - offsetX) / actualZoomLvl + marginToAdd,
  //       y: (canvasHeight - offsetY) / actualZoomLvl + marginToAdd,
  //     },
  //     svg_data = '';

  //   let pts = GridManager.getVisibleGridPoints(min, max);
  //   pts.forEach(pt => {
  //     svg_data += pt.toSVG('#F00', 1.5);
  //   });

  //   if (svg_data !== '') svg_data = '<!-- Grid -->\n' + svg_data + '\n';

  //   return svg_data;
  // }
}
