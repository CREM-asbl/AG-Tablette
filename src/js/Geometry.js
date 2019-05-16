import { settings } from "./Settings";

//Ensemble des formules géométriques réutilisables

export const distanceBetweenTwoPoints = (point1, point2) =>
    Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    

export const isCommonSegment = (point1, point2, point3, point4) => {
    const maxSquareDist = Math.pow(settings.get('precision'), 2)
    if (maxSquareDist >= distanceBetweenTwoPoints(point1, point3)
        && maxSquareDist >= distanceBetweenTwoPoints(point2, point4)) {
        return true
    }

    // if (maxSquareDist >= app.distanceBetweenTwoPoints(point1, point4)
    //     && maxSquareDist >= app.distanceBetweenTwoPoints(point2, point3)) {
    //     return true
    // }

    return false
}

// Todo : getCommonsSegments mais en attente de la relecture deu cahier des charges.
export const getCommonsSegments = (shape1, shape2) => {
    var commonsSegments = [],
       shape1StartPoint, 
       shape1EndPoint, 
       shape2StartPoint, 
       shape2EndPoint

    for (var i = 1; i < shape1.buildSteps.length; i++) {
        if (shape1.buildSteps[i].type != 'line') continue;
        shape1StartPoint = shape1.buildSteps[i - 1].getFinalPoint(shape1StartPoint);
        shape1StartPoint.x += shape1.x
        shape1StartPoint.y += shape1.y
        shape1EndPoint = shape1.buildSteps[i].getFinalPoint(shape1StartPoint);
        shape1EndPoint.x += shape1.x
        shape1EndPoint.y += shape1.y

        for (var j = 1; j < shape2.buildSteps.length; j++) {
            if (shape2.buildSteps[j].type != 'line') continue;
            shape2StartPoint = shape2.buildSteps[j - 1].getFinalPoint(shape2StartPoint);
            shape2StartPoint.x += shape2.x
            shape2StartPoint.y += shape2.y
            shape2EndPoint = shape2.buildSteps[j].getFinalPoint(shape2StartPoint);
            shape2EndPoint.x += shape2.x
            shape2EndPoint.y += shape2.y

            if (isCommonSegment(shape1StartPoint, shape1EndPoint, shape2StartPoint, shape2EndPoint)) {
                commonsSegments.push({
                    's1_index1': i - 1,
                    's1_index2': i,
                    's2_index1': j - 1,
                    's2_index2': j
                })
            }

            if (isCommonSegment(shape1StartPoint, shape1EndPoint, shape2EndPoint, shape2StartPoint)) {
                commonsSegments.push({
                    's1_index1': i - 1,
                    's1_index2': i,
                    's2_index1': j,
                    's2_index2': j - 1
                })
            }
        }
    }
    return commonsSegments
}