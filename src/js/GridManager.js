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


}
