import { app } from '../App';
import { ShapeManager } from './ShapeManager';

/*
TODO:
    -ajouter des facilités de sélection quand on ne peut sélectionner que
      des segments ou points (par ex).
 */
export class SelectManager {
  /**
   * Vérifier si 2 points sont à la distance de sélection l'un de l'autre.
   * @param  {Coordinates}  c1
   * @param  {Coordinates}  c2
   */
  static areCoordinatesInSelectionDistance(c1, c2) {
    let areInSelectionDistance = c1.equal(
      c2,
      app.settings.selectionDistance,
    );
    return areInSelectionDistance;
  }

  /**
   * Vérifier si 2 points sont à la distance de magnétisme l'un de l'autre.
   * @param  {Coordinates}  c1
   * @param  {Coordinates}  c2
   */
  static areCoordinatesInMagnetismDistance(c1, c2) {
    let areInMagnetismDistance = c1.equal(
      c2,
      app.settings.magnetismDistance,
    );
    return areInMagnetismDistance;
  }

  /**
   * Renvoie un objet de configuration des contraintes de sélection.
   * @return {Object}
   */
  static getEmptySelectionConstraints() {
    return {
      //'click' ou 'mousedown'
      eventType: 'click',
      //du + au - prioritaire. Les 3 valeurs doivent se retrouver dans le tableau.
      priority: ['points', 'segments', 'shapes'],
      blockHidden: false,
      canSelectFromUpper: false,
      shapes: {
        canSelect: false,
        // Liste de Shape. La forme doit être dans ce tableau s'il est non null
        whitelist: null,
        // Liste de Shape. La forme ne doit pas être dans ce tableau s'il est non null
        blacklist: null,
      },
      segments: {
        canSelect: false,
        /*
                Liste pouvant contenir différents éléments:
                    - {'shapeId': shapeId}
                      Le segment doit faire partie de cette forme.
                    - {'shapeId': shapeId, 'index': int}
                      Le segment doit être le segment n° index de la forme
                Si tableau non null, le segment doit satisfaire au moins un des
                élements de cette liste.
                 */
        whitelist: null,
        /*
                Liste pouvant contenir les mêmes éléments que whitelist.
                Si tableau non null, le segment ne doit satisfaire aucun des
                éléments de cette liste.
                 */
        blacklist: null,
      },
      points: {
        canSelect: false,
        //Indépendamment de whitelist et blacklist, le point doit être
        //d'un des types renseignés dans ce tableau.
        types: ['shapeCenter', 'vertex', 'divisionPoint', 'modifiablePoint'],
        /*
                Liste pouvant contenir différents éléments sous la forme:
                    - {'shapeId': shapeId}
                      Le point doit faire partie de cette forme.
                    - {'shapeId': shapeId, 'type': 'shapeCenter'}
                      Le point doit être le centre de la forme donnée.
                    - {'shapeId': shapeId, 'type': 'vertex'}
                      Le point doit être un sommet de la forme donnée.
                    - {'shapeId': shapeId, 'type': 'vertex', index: int}
                      Le point doit être le sommet d'index index de la forme donnée
                    - {'shapeId': shapeId, 'type': 'divisionPoint'}
                      Le point doit être un point de segment de la forme donnée.
                    - {'shapeId': shapeId, 'type': 'divisionPoint', index: int}
                      Le point doit être un point de segment de la forme donnée,
                      et l'index du segment doit être index.
                    - {'shapeId': shapeId, 'type': 'divisionPoint', index: int, ratio: ratio}
                      Le point doit être un point de segment de la forme donnée,
                      dont le segment est d'index index et dont le ratio vaut ratio.
                Si tableau non null, le segment doit satisfaire au moins un des
                élements de cette liste.
                 */
        whitelist: null,
        /*
                Liste pouvant contenir les mêmes éléments que whitelist.
                Si tableau non null, le segment ne doit satisfaire aucun des
                éléments de cette liste.
                 */
        blacklist: null,
      },
    };
  }

  /**
   * Essaie de sélectionner un point, en fonction des contraintes données.
   * Renvoie null si pas de point.
   * @param  {Point} mouseCoordinates
   * @param  {Object} constraints      Contraintes. Voir selectionConstraints.points.
   * @param  {Boolean} easySelection   true si selectionDistance, false si magnetismDistance
   * @param  {Boolean} all si retourne tous les points et pas seulement le plus haut / proche
   * @return {Point}
   */
  static selectPoint(
    mouseCoordinates,
    constraints,
    easySelection = true,
    all = false,
  ) {
    if (!constraints.canSelect) return null;

    let distCheckFunction = easySelection
      ? SelectManager.areCoordinatesInSelectionDistance
      : SelectManager.areCoordinatesInMagnetismDistance;

    // all points at the correct distance
    let potentialPoints = [];
    let allPoints = [...app.mainDrawingEnvironment.points];
    if (constraints.canSelectFromUpper)
      allPoints.push(...app.upperDrawingEnvironment.points);
    allPoints.forEach((pt) => {
      if (pt.visible) {
        if (
          constraints.types.includes(pt.type) &&
          distCheckFunction(pt.coordinates, mouseCoordinates)
        ) {
          potentialPoints.push(pt);
        }
      }
    });

    // apply constrains
    const constrainedPoints = potentialPoints.filter((potentialPoint) => {
      if (constraints.whitelist != null) {
        if (
          !constraints.whitelist.some((constr) => {
            if (constr.shapeId != potentialPoint.shapeId) return false;
            if (constr.type == 'shapeCenter')
              return potentialPoint.type == 'shapeCenter';
            if (constr.type == 'vertex')
              return (
                potentialPoint.type == 'vertex' &&
                (constr.index == undefined ||
                  constr.index == potentialPoint.idx)
              );
            if (constr.type == 'divisionPoint')
              return (
                potentialPoint.type == 'divisionPoint' &&
                (constr.index == undefined ||
                  constr.index == potentialPoint.segments[0].idx) &&
                (constr.ratio == undefined ||
                  Math.abs(constr.ratio - potentialPoint.ratio) < 0.001)
              );
            return true;
          })
        )
          return false;
      }
      if (constraints.blacklist != null) {
        if (
          constraints.blacklist.some((constr) => {
            if (constr.shapeId != potentialPoint.shapeId) return false;
            if (constr.type == 'shapeCenter')
              return potentialPoint.type == 'shapeCenter';
            if (constr.type == 'vertex')
              return (
                potentialPoint.type == 'vertex' &&
                (constr.index == undefined ||
                  constr.index == potentialPoint.idx)
              );
            if (constr.type == 'divisionPoint')
              return (
                potentialPoint.type == 'divisionPoint' &&
                (constr.index == undefined ||
                  constr.index == potentialPoint.segments[0].idx) &&
                (constr.ratio == undefined ||
                  Math.abs(constr.ratio - potentialPoint.ratio) < 0.001)
              );
            return true;
          })
        )
          return false;
      }
      return true;
    });

    // if no possibilities
    if (constrainedPoints.length == 0) return null;

    if (all) {
      return constrainedPoints.flat();
    }

    let notHiddenPoints = constrainedPoints;
    if (constraints.blockHidden) {
      notHiddenPoints = [];
      const shapes = ShapeManager.shapesThatContainsCoordinates(
        mouseCoordinates,
      );
      constrainedPoints.forEach((pt) => {
        let shapeIndex = ShapeManager.getShapeIndex(pt.shape);
        if (
          shapes.every((s) => {
            let otherShapeIndex = ShapeManager.getShapeIndex(s);
            return otherShapeIndex < shapeIndex;
          })
        )
          notHiddenPoints.push(pt);
      });
    }

    let bestPoint = notHiddenPoints[0],
      minDist = notHiddenPoints[0].coordinates.dist(mouseCoordinates);
    notHiddenPoints.forEach((pt) => {
      let dist = pt.coordinates.dist(mouseCoordinates);
      if (dist < minDist) {
        minDist = dist;
        bestPoint = pt;
      }
    });

    return bestPoint;
  }

  static selectSegment(mouseCoordinates, constraints) {
    if (!constraints.canSelect) return null;

    // all segments at the correct distance
    let potentialSegments = [];
    let allSegments = [...app.mainDrawingEnvironment.segments];
    if (constraints.canSelectFromUpper)
      allSegments.push(...app.upperDrawingEnvironment.segments);
    allSegments.forEach((seg) => {
      const projection = seg.projectionOnSegment(mouseCoordinates);
      if (
        seg.isCoordinatesOnSegment(projection) &&
        SelectManager.areCoordinatesInSelectionDistance(
          projection,
          mouseCoordinates,
        )
      ) {
        potentialSegments.push({
          segment: seg,
          dist: projection.dist(mouseCoordinates),
        });
      }
    });

    // apply constrains
    const constrainedSegments = potentialSegments.filter((potentialSegment) => {
      let segment = potentialSegment.segment;
      if (constraints.whitelist != null) {
        if (
          !constraints.whitelist.some((constr) => {
            if (constr.shapeId != segment.shapeId) return false;
            if (constr.index !== undefined) return constr.index == segment.idx;
            return true;
          })
        )
          return false;
      }
      if (constraints.blacklist != null) {
        if (
          constraints.blacklist.some((constr) => {
            if (constr.shapeId != segment.shapeId) return false;
            if (constr.index !== undefined) return constr.index == segment.idx;
            return true;
          })
        )
          return false;
      }
      return true;
    });

    // if no possibilities
    if (constrainedSegments.length == 0) return null;

    // no possibilities to choose blockHidden constraints

    let bestSegment = constrainedSegments[0].segment,
      minDist = constrainedSegments[0].dist;
    constrainedSegments.forEach((constrainedSegment) => {
      let segment = constrainedSegment.segment;
      let dist = constrainedSegment.dist;
      if (dist < minDist) {
        minDist = dist;
        bestSegment = segment;
      }
    });

    return bestSegment;
  }

  /**
   * Essaie de sélectionner une forme, en fonction des contraintes données.
   * Renvoie null si pas de forme.
   * @param  {Point} mouseCoordinates
   * @param  {Object} constraints      Contraintes. Voir selectionConstraints.shapes.
   * @return {Shape}
   */
  static selectShape(mouseCoordinates, constraints) {
    if (!constraints.canSelect) return null;

    let shapes = ShapeManager.shapesThatContainsCoordinates(
      mouseCoordinates,
      constraints,
    );

    if (constraints.whitelist != null) {
      shapes = shapes.filter((shape) => {
        return constraints.whitelist.some((shape2) => {
          return shape.id == shape2.id;
        });
      });
    }

    if (constraints.blacklist != null) {
      shapes = shapes.filter((shape) => {
        return constraints.blacklist.every((shape2) => {
          return shape.id != shape2.id;
        });
      });
    }
    if (shapes.length > 0) return shapes[0];

    return null;
  }

  /**
   * Essaie de sélectionner un objet (point, segment, forme) en fonction des
   * contraintes définies via setSelectionConstraints. Renvoie null si aucun
   * objet n'a pu être sélectionné.
   * @param  {Point} mouseCoordinates
   * @return {Object} Renvoie soit:
   *          - Pour une forme: un objet de type Shape;
   *          - Pour un segment: un objet de type Segment;
   *          - Pour un point: un objet de type Point;
   */
  static selectObject(mouseCoordinates) {
    let constr = app.workspace.selectionConstraints,
      calls = {
        points: (mCoord, constr) => {
          return SelectManager.selectPoint(mCoord, constr);
        },
        segments: (mCoord, constr) => {
          return SelectManager.selectSegment(mCoord, constr);
        },
        shapes: (mCoord, constr) => {
          return SelectManager.selectShape(mCoord, constr);
        },
      };
    //Vérification que priority est bien défini
    if (
      !constr.priority.every((p) => {
        return ['points', 'segments', 'shapes'].includes(p);
      }) ||
      constr.priority.length != 3
    ) {
      console.error('Bad constr.priority value!');
      return null;
    }

    for (let i = 0; i < constr.priority.length; i++) {
      let f = calls[constr.priority[i]],
        obj = f(mouseCoordinates, constr[constr.priority[i]]);
      if (obj) {
        window.dispatchEvent(
          new CustomEvent('objectSelected', {
            detail: { object: obj, mousePos: mouseCoordinates },
          }),
        );
        return obj;
      }
    }
    return null;
  }
}

window.addEventListener('reset-selection-constraints', () => {
  app.workspace.selectionConstraints = SelectManager.getEmptySelectionConstraints();
});
// window.addEventListener('app-state-changed', () => {
//   app.workspace.selectionConstraints = SelectManager.getEmptySelectionConstraints();
// });
let click_all_shape_constr = SelectManager.getEmptySelectionConstraints();
click_all_shape_constr.eventType = 'click';
click_all_shape_constr.shapes.canSelect = true;
let mousedown_all_shape_constr = SelectManager.getEmptySelectionConstraints();
mousedown_all_shape_constr.eventType = 'mousedown';
mousedown_all_shape_constr.shapes.canSelect = true;
let click_all_segments_constr = SelectManager.getEmptySelectionConstraints();
click_all_segments_constr.eventType = 'click';
click_all_segments_constr.segments.canSelect = true;
app.fastSelectionConstraints = {
  click_all_shape: click_all_shape_constr,
  mousedown_all_shape: mousedown_all_shape_constr,
  click_all_segments: click_all_segments_constr,
};
