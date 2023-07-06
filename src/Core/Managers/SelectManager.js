import { app } from '../App';
import { LineShape } from '../Objects/Shapes/LineShape';
import { RegularShape } from '../Objects/Shapes/RegularShape';
import { SinglePointShape } from '../Objects/Shapes/SinglePointShape';
import { StripLineShape } from '../Objects/Shapes/StripLineShape';
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
    let areInSelectionDistance = c1.equal(c2, app.settings.selectionDistance / app.workspace.zoomLevel);
    return areInSelectionDistance;
  }

  /**
   * Vérifier si 2 points sont à la distance de magnétisme l'un de l'autre.
   * @param  {Coordinates}  c1
   * @param  {Coordinates}  c2
   */
  static areCoordinatesInMagnetismDistance(c1, c2) {
    let areInMagnetismDistance = c1.equal(c2, app.settings.magnetismDistance / app.workspace.zoomLevel);
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
      shapes: {
        canSelect: false,
        canSelectFromUpper: false,
        // Liste de Shape. La figure doit être dans ce tableau s'il est non null
        whitelist: null,
        // Liste de Shape. La figure ne doit pas être dans ce tableau s'il est non null
        blacklist: null,
      },
      segments: {
        canSelect: false,
        canSelectFromUpper: false,
        /*
                Liste pouvant contenir différents éléments:
                    - {'shapeId': shapeId}
                      Le segment doit faire partie de cette figure.
                    - {'shapeId': shapeId, 'index': int}
                      Le segment doit être le segment n° index de la figure
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
        // one, allInDistance
        numberOfObjects: 'one',
      },
      points: {
        canSelect: false,
        canSelectFromUpper: false,
        //Indépendamment de whitelist et blacklist, le point doit être
        //d'un des types renseignés dans ce tableau.
        types: ['shapeCenter', 'vertex', 'divisionPoint', 'modifiablePoint', 'arcCenter'],
        /*
                Liste pouvant contenir différents éléments sous la figure:
                    - {'shapeId': shapeId}
                      Le point doit faire partie de cette figure.
                    - {'shapeId': shapeId, 'type': 'shapeCenter'}
                      Le point doit être le centre de la figure donnée.
                    - {'shapeId': shapeId, 'type': 'vertex'}
                      Le point doit être un sommet de la figure donnée.
                    - {'shapeId': shapeId, 'type': 'vertex', index: int}
                      Le point doit être le sommet d'index index de la figure donnée
                    - {'shapeId': shapeId, 'type': 'divisionPoint'}
                      Le point doit être un point de segment de la figure donnée.
                    - {'shapeId': shapeId, 'type': 'divisionPoint', index: int}
                      Le point doit être un point de segment de la figure donnée,
                      et l'index du segment doit être index.
                    - {'shapeId': shapeId, 'type': 'divisionPoint', index: int, ratio: ratio}
                      Le point doit être un point de segment de la figure donnée,
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
        // one, allInDistance, allSuperimposed
        numberOfObjects: 'one',
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
  ) {
    if (!constraints.canSelect) return null;

    let distCheckFunction = easySelection
      ? SelectManager.areCoordinatesInSelectionDistance
      : SelectManager.areCoordinatesInMagnetismDistance;

    // all points at the correct distance
    let potentialPoints = [];
    let allPoints = [...app.mainCanvasLayer.points];

    if (app.environment.name == 'Geometrie') {
      allPoints = allPoints.filter(pt => pt.shape.geometryObject?.geometryIsVisible !== false)
        .filter(pt => pt.shape.geometryObject?.geometryIsHidden !== true)
        .filter(pt => pt.shape.geometryObject?.geometryIsConstaintDraw == false);
    }

    if (constraints.canSelectFromUpper)
      allPoints.push(...app.upperCanvasLayer.points);
    allPoints.forEach((pt) => {
      if (pt.visible && pt.geometryIsVisible && !pt.geometryIsHidden) {
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

    // sort by distance, by shape height and by index in the shape, taking next criteria when equal
    constrainedPoints.sort((pt1, pt2) => {
      let dist1 = pt1.coordinates.dist(mouseCoordinates);
      let dist2 = pt2.coordinates.dist(mouseCoordinates);
      if (Math.abs(dist1 - dist2) > 0.001)
        return dist1 - dist2;

      if (pt1.shape.layer == 'upper' && pt2.shape.layer == 'main')
        return -1;
      if (pt2.shape.layer == 'upper' && pt1.shape.layer == 'main')
        return 1;

      let shapeIndex1 = ShapeManager.getShapeIndex(pt1.shape);
      let shapeIndex2 = ShapeManager.getShapeIndex(pt2.shape);
      if (shapeIndex1 != shapeIndex2)
        return shapeIndex2 - shapeIndex1;

      if (pt1.type == 'vertex' && pt2.type == 'vertex')
        return pt2.idx - pt1.idx;
      return 0;
    });

    if (constraints.numberOfObjects == "allInDistance") {
      return constrainedPoints;
    }

    // let notHiddenPoints = constrainedPoints;
    constrainedPoints.forEach(pt => pt.isBehindShape = false);
    if (constraints.blockHidden) {
      // notHiddenPoints = [];
      const shapes = ShapeManager.shapesThatContainsCoordinates(
        mouseCoordinates,
      );
      constrainedPoints.forEach((pt) => {
        let shapeIndex = ShapeManager.getShapeIndex(pt.shape);
        if (
          !shapes.every((s) => {
            let otherShapeIndex = ShapeManager.getShapeIndex(s);
            return otherShapeIndex <= shapeIndex;
          })
        ) {
          // pt.isBehindShape = false;
        // } else {
          pt.isBehindShape = true;
        }
          // notHiddenPoints.push(pt);
      });

      // if no possibilities
      // if (notHiddenPoints.length == 0) return null;
      if (!constrainedPoints.find(pt => pt.isBehindShape == false)) return false
    }

    if (constraints.numberOfObjects == 'one')
      return constrainedPoints.find(pt => pt.isBehindShape == false);//notHiddenPoints[0];
    else if (constraints.numberOfObjects == 'allSuperimposed') {
      let firstPointCoord = constrainedPoints.find(pt => pt.isBehindShape == false).coordinates;
      // let coordPt1 = constrainedPoints[firstPointIndex].coordinates//notHiddenPoints[0].coordinates;
      let i = 0;//1;
      for (; i < constrainedPoints.length; i++) {
        if (firstPointCoord.dist(constrainedPoints[i]) > 0.01) {
          return constrainedPoints.slice(0, i);
        }
      }
      return constrainedPoints.slice(0, i);
    }
  }

  static selectSegment(mouseCoordinates, constraints) {
    if (!constraints.canSelect) return null;

    // all segments at the correct distance
    let potentialSegments = [];
    let allSegments = [...app.mainCanvasLayer.segments];

    if (app.environment.name == 'Geometrie') {
      allSegments = allSegments.filter(seg => seg.shape.geometryObject?.geometryIsVisible !== false)
        .filter(seg => seg.shape.geometryObject?.geometryIsHidden !== true)
        .filter(seg => seg.shape.geometryObject?.geometryIsConstaintDraw == false);
    }

    if (constraints.canSelectFromUpper)
      allSegments = [...app.upperCanvasLayer.segments, ...allSegments];
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

    potentialSegments.sort((segInfo1, segInfo2) => {
      return segInfo1.dist - segInfo2.dist;
    });
    potentialSegments = potentialSegments.map(segInfo => segInfo.segment);

    // apply constrains
    const constrainedSegments = potentialSegments.filter((potentialSegment) => {
      if (constraints.whitelist != null) {
        if (
          !constraints.whitelist.some((constr) => {
            if (constr.shapeId != potentialSegment.shapeId) return false;
            if (constr.index !== undefined) return constr.index == potentialSegment.idx;
            return true;
          })
        )
          return false;
      }
      if (constraints.blacklist != null) {
        if (
          constraints.blacklist.some((constr) => {
            if (constr.shapeId != potentialSegment.shapeId) return false;
            if (constr.index !== undefined) return constr.index == potentialSegment.idx;
            return true;
          })
        )
          return false;
      }
      return true;
    });

    // if no possibilities
    if (constrainedSegments.length == 0) return null;

    if (constraints.numberOfObjects == "allInDistance") {
      return constrainedSegments;
    }

    // no possibilities to choose blockHidden constraints

    let notHiddenSegments = constrainedSegments;
    if (constraints.blockHidden) {
      notHiddenSegments = [];
      const shapes = ShapeManager.shapesThatContainsCoordinates(
        mouseCoordinates,
      );
      constrainedSegments.forEach((seg) => {
        let shapeIndex = ShapeManager.getShapeIndex(seg.shape);
        if (
          shapes.every((s) => {
            let otherShapeIndex = ShapeManager.getShapeIndex(s);
            return otherShapeIndex <= shapeIndex;
          })
        )
          notHiddenSegments.push(seg);
      });

      // if no possibilities
      if (notHiddenSegments.length == 0) return null;
    }

    return notHiddenSegments[0];
  }

  /**
   * Essaie de sélectionner une figure, en fonction des contraintes données.
   * Renvoie null si pas de figure.
   * @param  {Point} mouseCoordinates
   * @param  {Object} constraints      Contraintes. Voir selectionConstraints.shapes.
   * @return {Shape}
   */
  static selectShape(mouseCoordinates, constraints) {
    if (!constraints.canSelect) return null;

    let shapes = ShapeManager.shapesThatContainsCoordinates(
      mouseCoordinates,
      constraints,
    )

    if (app.environment.name == 'Geometrie') {
      shapes = shapes.filter(s => s.geometryObject?.geometryIsVisible !== false)
        .filter(s => s.geometryObject?.geometryIsHidden !== true)
        .filter(s => s.geometryObject?.geometryIsConstaintDraw == false);
    }

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

    if (shapes.length > 0) {
      if (shapes[0] instanceof RegularShape || shapes[0] instanceof StripLineShape || (shapes[0] instanceof LineShape && shapes[0].segments[0].isArc()))
        return shapes[0]
      let idx = shapes.findIndex(s => s instanceof RegularShape);
      if (idx != -1)
        shapes = shapes.slice(0, idx);
      let dists = shapes.map(s => {
        if (s instanceof LineShape) {
          let projection = s.segments[0].projectionOnSegment(mouseCoordinates);
          return projection.dist(mouseCoordinates);
        } else if (s instanceof SinglePointShape) {
          return s.points[0].coordinates.dist(mouseCoordinates) / 10;
        }
      });
      const minDistance = Math.min(...dists);
      const minDistanceIndex = dists.indexOf(minDistance);
      return shapes[minDistanceIndex];
    }
    return null;
  }

  /**
   * Essaie de sélectionner un objet (point, segment, figure) en fonction des
   * contraintes définies via setSelectionConstraints. Renvoie null si aucun
   * objet n'a pu être sélectionné.
   * @param  {Point} mouseCoordinates
   * @return {Object} Renvoie soit:
   *          - Pour une figure: un objet de type Shape;
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
