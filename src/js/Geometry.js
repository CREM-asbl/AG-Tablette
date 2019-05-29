import { settings } from "./Settings";

//Ensemble des formules géométriques réutilisables

//Todo: Essayer d'améliorer le logiciel afin de se passer du paramètre précision dans ces formules

export const distanceBetweenTwoPoints = (point1, point2) =>
    Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2))


export const isCommonSegment = (point1, point2, point3, point4) => {
    const delta = settings.get('precision')
    return (distanceBetweenTwoPoints(point1, point3) <= delta
        && distanceBetweenTwoPoints(point2, point4) <= delta)
}

export const hasCommonSegments = (shape1, shape2) => {
    for (let i = 0; i < shape1.points.length; i++) {
        if (shape1.buildSteps[i + 1].type != 'line') continue
        let shape1StartPoint = shape1.points[i].getAbsoluteCoordinates()
        let shape1EndPoint = shape1.points[(i + 1) % shape1.points.length].getAbsoluteCoordinates() 

        for (let j = 0; j < shape2.points.length; j++) {
            if (shape2.buildSteps[j + 1].type != 'line') continue
            let shape2StartPoint = shape2.points[j].getAbsoluteCoordinates()
            let shape2EndPoint = shape2.points[(j + 1) % shape2.points.length].getAbsoluteCoordinates()

            if (isCommonSegment(shape1StartPoint, shape1EndPoint, shape2StartPoint, shape2EndPoint)
                || isCommonSegment(shape1StartPoint, shape1EndPoint, shape2EndPoint, shape2StartPoint)) {
                return true
            }
        }
    }
    return false
}

export const isSamePoints = (point1, point2) => {
    const delta = settings.get('precision')
    return distanceBetweenTwoPoints(point1, point2) <= delta
    // return point1.x === point2.x && point1.y === point2.y
}