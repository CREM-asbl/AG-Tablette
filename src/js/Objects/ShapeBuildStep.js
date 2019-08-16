import { Points } from '../Tools/points'

export class ShapeBuildStep {
    constructor(type) {
        if(this.constructor === ShapeBuildStep) {
            throw new TypeError('Abstract class "ShapeBuildStep" cannot be instantiated directly');
        }
        this.type = type;
    }
    copy() {
        throw new TypeError("Copy method not implemented");
    }
}

export class Segment extends ShapeBuildStep {
    constructor({x, y}, isArc = false) {
        super("segment");
        this.coordinates = { x, y };
        this.points = [];
        this.isArc = isArc;
    }

    addPoint({x, y}) {
        //TODO: garder les points triés?
        this.points.push({x, y});
    }

    deletePoint(point) {
        let i = this.points.findIndex(pt => {
            return Points.equal(pt, point);
        });
        if(i==-1) {
            console.error("couldn't delete point from segment");
            return null;
        }
        this.points.splice(i, 1);
    }

    copy() {
        let copy = new Segment(this.coordinates, this.isArc);
        this.points.forEach(p => {
            copy.addPoint(p);
        })
        return copy;
    }

    saveToObject() {
        const save = {
            'type': 'segment',
            'coordinates': {'x': this.coordinates.x, 'y': this.coordinates.y},
            'points': this.points.map(pt => {
                return {'x': pt.x, 'y': pt.y};
            }),
            'isArc': this.isArc
        };
        return save;
    }
}

export class Vertex extends ShapeBuildStep {
    constructor({x, y}) {
        super("vertex");
        this.coordinates = { x, y };
    }

    copy() {
        return new Vertex(this.coordinates);
    }

    saveToObject() {
        const save = {
            'type': 'vertex',
            'coordinates': {'x': this.coordinates.x, 'y': this.coordinates.y}
        };
        return save;
    }
}

export class MoveTo extends ShapeBuildStep {
    constructor({x, y}) {
        super("moveTo");
        this.coordinates = { x, y };
    }

    copy() {
        return new MoveTo(this.coordinates);
    }

    saveToObject() {
        const save = {
            'type': 'moveTo',
            'coordinates': {'x': this.coordinates.x, 'y': this.coordinates.y}
        };
        return save;
    }
}
