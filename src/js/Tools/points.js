
export class Points {
    //TODO généraliser pour un nombre non défini de points.
    static add({x: x1, y: y1}, {x: x2, y: y2}, {x: x3, y: y3} = {x: 0, y: 0}) {
        return {
            'x': x1 + x2 + x3,
            'y': y1 + y2 + y3
        };
    }

    static sub({x: x1, y: y1}, {x: x2, y: y2}) {
        return {
            'x': x1 - x2,
            'y': y1 - y2
        };
    }

    static copy({x, y}) {
        return {
            'x': x,
            'y': y
        };
    }

    static create(x, y) {
        return {
            'x': x,
            'y': y
        };
    }

    static set(point, x, y) {
        point.x = x;
        point.y = y;
    }

    static dist({x: x1, y: y1}, {x: x2, y: y2}) {
        let pow1 = Math.pow(x2 - x1, 2),
            pow2 = Math.pow(y2 - y1, 2);
        return Math.sqrt(pow1 + pow2);
    }

    static equal({x: x1, y: y1}, {x: x2, y: y2}) {
        return Math.abs(x2-x1) < 0.00001 && Math.abs(y2-y1) < 0.00001;
    }
}
