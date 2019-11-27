import { app } from './App';
import { Points } from './Tools/points';
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

  static show() {
    app.workspace.settings.set('isGridShown', true);
  }
  static hide() {
    app.workspace.settings.set('isGridShown', false);
  }

  static setSize(newSize) {
    app.workspace.settings.set('gridSize', newSize);
  }

  static setType(newType) {
    if (!['square', 'triangle'].includes(newType)) {
      console.error('Type invalide');
      return;
    }
    app.workspace.settings.set('gridType', newType);
  }

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
      let height = 43.3012701892 * 2;
      let topleft1 = new Point(
        x - ((x - 10) % (50 * gridSize)),
        y - ((y - 10) % (height * gridSize)),
      );
      let topleft2 = new Point(
        x - ((x - (10 + 25 * gridSize)) % (50 * gridSize)),
        y - ((y - (10 + 43.3012701892 * gridSize)) % (height * gridSize)),
      );
      possibilities.push(topleft1);
      possibilities.push(topleft1.addCoordinates(0, height * gridSize));
      possibilities.push(topleft1.addCoordinates(50 * gridSize, 0));
      possibilities.push(topleft1.addCoordinates(50 * gridSize, height * gridSize));

      possibilities.push(topleft2);
      possibilities.push(topleft2.addCoordinates(0, height * gridSize));
      possibilities.push(topleft2.addCoordinates(50 * gridSize, 0));
      possibilities.push(topleft2.addCoordinates(50 * gridSize, height * gridSize));
      possibilities.push(topleft2);
    }

    let closest = possibilities[0],
      smallestSquareDist = closest.dist(point);
    possibilities.forEach(possibility => {
      let dist = possibility.dist(point);
      if (dist < smallestSquareDist) {
        smallestSquareDist = dist;
        closest = possibility;
      }
    });

    return closest;
  }

  /**
	 * Grille: Renvoie le point de la grille le plus proche d'un sommet
	 * appartenenat à une des formes d'un groupe.
     * @param  {[Shape]} shapes       Le groupe de formes que l'on déplace
     * @param  {Shape} mainShape      La forme principale
     * @param  {Point} coordinates    Les coordonnées de la forme principale
	 * @return {{'gridPoint': Point, 'shape': Shape, 'shapePoint': Object}}
	 * Le point de la grille, la forme à laquelle le sommet appartient, et un
	 * objet représentant le point de la forme:
	 * {
	 *     'shape': Shape,
	 *     'relativePoint': Point,
	 *     'realPoint': Point,
	 *     'type': 'vertex',
	 *     'vertexIndex': int
     }
	 *
	 * Il faut considérer que les coordonnées des formes du groupe (shapes[i].x,
	 * shapes[i].y) doivent d'abord subir une translation de coordinates-mainShape!
	 */
  static getClosestGridPointFromShapeGroup(shapes, mainShape, coordinates) {
    /*
        Calcule la liste des sommets des formes
        Les points de subdivision de segments ne doivent pas être attirés par la
        grille.

        Pour l'instant, s'il existe au moins un sommet, on trouve le sommet le
        plus proche d'un point de la grille. S'il n'y a pas de sommet, mais
        qu'au moins une des formes a son centre affiché, alors on utilise le
        centre le plus proche d'un point de la grille.
         */
    let points = shapes
      .map(s => {
        let list = [];
        s.buildSteps.forEach((vertex, i1) => {
          if (vertex.type == 'vertex') {
            list.push({
              shape: s,
              relativeCoordinates: vertex.coordinates,
              coordinates: vertex.coordinates
                .addCoordinates(s)
                .addCoordinates(coordinates)
                .addCoordinates(mainShape, -1),
              pointType: 'vertex',
              index: i1,
            });
          }
        });
        return list;
      })
      .reduce((total, val) => {
        return total.concat(val);
      }, []);

    //Centres?
    if (points.length == 0) {
      points = shapes
        .filter(s => s.isCenterShown)
        .map(s => {
          return {
            shape: s,
            relativeCoordinates: s.center,
            coordinates: s.center
              .addCoordinates(s)
              .addCoordinates(coordinates)
              .addCoordinates(mainShape, -1),
            pointType: 'center',
          };
        });
      if (points.length == 0) return null;
    }

    let best = null,
      bestDist = 1000 * 1000 * 1000;

    points.forEach(pt => {
      let gridPoint = this.getClosestGridPoint(pt.coordinates),
        dist = pt.coordinates.dist(gridPoint);
      if (dist < bestDist) {
        best.shape = pt.shape;
        best.shapePoint = pt;
        best.gridPoint = gridPoint;
        bestDist = dist;
      }
    });

    return best;
  }
}
