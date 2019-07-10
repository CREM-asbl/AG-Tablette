import { app } from './App'

export class GridManager {
    /**
     * Le point de référence de la grille est le point (10,10).
     * Si grille carrée: le côté du carré est de 50 unités. (-> ex de points:
     *      (60, 60), (60,10), (10,60), ...)
     * Si grille triangulaire: la base du triangle est de 50 unités, et le
     * triangle est équilatéral.
     * 		(-> Ex de points: (-15, 52.5), (35, 52.5), (60, 10), ...)
     */

    static show() { app.settings.set("isGridShown", true); }
    static hide() { app.settings.set("isGridShown", false); }

    static setSize(newSize) { app.settings.set("gridSize", newSize); }

    static setType(newType) {
        if(!['square', 'triangle'].includes(newType)) {
            console.error("Type invalide");
            return;
        }
        app.settings.set("gridType", newType);
    }

    static getVisibleGridPoints(minPoint, maxPoint) {
        if(!app.settings.get("isGridShown")) return [];

        let ptList = [],
            size = app.settings.get("gridSize"),
            type = app.settings.get("gridType");
        if (type == "square") {
            let t1 = Math.ceil((minPoint.x - 10) / (50 * size)),
                startX = 10 + t1 * 50 * size,
                t2 = Math.ceil((minPoint.y - 10) / (50 * size)),
                startY = 10 + t2 * 50 * size;
			for (let x = startX; x <= maxPoint.x; x += 50*size) {
				for (let y = startY; y <= maxPoint.y; y += 50*size) {
                    ptList.push({ "x": x, "y": y });
				}
			}
		} else { //triangle
            let approx = 43.3012701892,
                t1 = Math.ceil((minPoint.x - 10) / (50 * size)),
                startX = 10 + t1 * 50 * size,
                t2 = Math.ceil((minPoint.y - 10) / (approx * 2 * size)),
                startY = 10 + t2 * approx * 2 * size;

			for(let x = startX; x <= maxPoint.x; x += 50*size) {
				for(let y = startY; y <= maxPoint.y; y += approx*2*size) {
					ptList.push({ "x": x, "y": y });
				}
			}

            t1 = Math.ceil((minPoint.x - 10 - 50 * size / 2) / (50 * size));
			startX = 10 + 50 * size / 2 + t1 * 50 * size;
            t2 = Math.ceil((minPoint.y - 10 - approx * size) / (approx*2*size));
			startY = 10 + approx * size + t2 * approx * 2 * size;
			for(let x = startX; x <= maxPoint.x; x += 50*size) {
				for(let y = startY; y <= maxPoint.y; y += approx*2*size) {
					ptList.push({ "x": x, "y": y });
				}
			}
		}
        return ptList;
    }

    /*
    **
	 * Grille: Renvoie le point de la grille (grid) le plus proche d'un point
	 * quelconque d'un groupe de forme
	 * @param  {[Shape]} shapesList liste des formes
	 * @return {{'grid': point, 'shape': point}} le point de la grille le plus
	 * proche, et le point correspondant du groupe de forme.
	 *
	getClosestGridPoint(shapesList) {
		var pointsList = [];
		for (var i = 0; i < shapesList.length; i++) {
			for (var j = 0; j < shapesList[i].points.length; j++) {
				pointsList.push(shapesList[i].points[j]);
			}
		}
		if (pointsList.length === 0) return null

		const getClosestPoint = function (point) {
			var x = point.getAbsoluteCoordinates().x,
				y = point.getAbsoluteCoordinates().y;

			var possibilities = [];
			var gridType = settings.get('gridType');
			var gridSize = settings.get('gridSize');
			if (gridType == 'square') {
				var topleft = {
					'x': x - ((x - 10) % (50 * gridSize)),
					'y': y - ((y - 10) % (50 * gridSize))
				};
				possibilities.push(topleft);
				possibilities.push({ 'x': topleft.x, 'y': topleft.y + 50 * gridSize });
				possibilities.push({ 'x': topleft.x + 50 * gridSize, 'y': topleft.y });
				possibilities.push({ 'x': topleft.x + 50 * gridSize, 'y': topleft.y + 50 * gridSize });
			} else if (gridType == 'triangle') {
				var topleft1 = {
					'x': x - ((x - 10) % (50 * gridSize)),
					'y': y - ((y - 10) % (43.3012701892 * 2 * gridSize))
				};
				var topleft2 = {
					'x': x - ((x - (10 + 25 * gridSize)) % (50 * gridSize)),
					'y': y - ((y - (10 + 43.3012701892 * gridSize)) % (43.3012701892 * 2 * gridSize))
				};
				possibilities.push(topleft1);
				possibilities.push({ 'x': topleft1.x, 'y': topleft1.y + 43.3012701892 * 2 * gridSize });
				possibilities.push({ 'x': topleft1.x + 50 * gridSize, 'y': topleft1.y });
				possibilities.push({ 'x': topleft1.x + 50 * gridSize, 'y': topleft1.y + 43.3012701892 * 2 * gridSize });

				possibilities.push(topleft2);
				possibilities.push({ 'x': topleft2.x, 'y': topleft2.y + 43.3012701892 * 2 * gridSize });
				possibilities.push({ 'x': topleft2.x + 50 * gridSize, 'y': topleft2.y });
				possibilities.push({ 'x': topleft2.x + 50 * gridSize, 'y': topleft2.y + 43.3012701892 * 2 * gridSize });
			} else {
				console.error("Workspace.getClosestGridPoint: unknown type: " + gridType);
				return null;
			}

			var closest = possibilities[0];
			var smallestSquareDist = Math.pow(closest.x - x, 2) + Math.pow(closest.y - y, 2);
			for (var i = 1; i < possibilities.length; i++) {
				var d = Math.pow(possibilities[i].x - x, 2) + Math.pow(possibilities[i].y - y, 2);
				if (d < smallestSquareDist) {
					smallestSquareDist = d;
					closest = possibilities[i];
				}
			}

			return { 'dist': Math.sqrt(smallestSquareDist), 'point': new Point(closest.x, closest.y, "grid", null) };
		};

		var bestShapePoint = pointsList[0];
		var t = getClosestPoint(bestShapePoint);
		var bestDist = t.dist;
		var bestGridPoint = t.point;
		for (var i = 0; i < pointsList.length; i++) {
			var t = getClosestPoint(pointsList[i]);
			if (t.dist < bestDist) {
				bestDist = t.dist;
				bestGridPoint = t.point;
				bestShapePoint = pointsList[i];
			}
		}

		return {
			'grid': bestGridPoint,
			'shape': bestShapePoint
		};
	};
     */

}
