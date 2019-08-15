import { uniqId } from '../Tools/general'


export class Tangram {

    /**
     * Constructeur
     * @param {[Shape]} shapes   Liste des formes nécessaires pour construire le
     *                           le tangram.
     * @param {[[Points]]} polygons Liste de polygones (= de tableaux de points)
     */
    constructor(name, shapes, polygons) {
        this.id = uniqId();

        this.name = name;

        this.shapes = shapes;

        this.polygons = polygons;
    }

    saveToObject() {
        let data = {
            id: this.id,
            name: this.name,
            shapes: this.shapes.map(s => s.saveToObject()),
            polygons: this.polygons
        };
		return data;
    }

    initFromObject(data) {
        this.id = data.id;
        this.name = data.name;
        this.shapes = data.shapes;
        this.polygons = data.polygons;
    }
}
