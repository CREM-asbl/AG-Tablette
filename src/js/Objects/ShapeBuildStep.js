

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

    copy() {
        let copy = new Segment(this.coordinates, this.isArc);
        this.points.forEach(p => {
            copy.addPoint(p);
        })
        return copy;
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
}

export class MoveTo extends ShapeBuildStep {
    constructor({x, y}) {
        super("moveTo");
        this.coordinates = { x, y };
    }

    copy() {
        return new MoveTo(this.coordinates);
    }
}
