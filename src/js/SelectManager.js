import { app } from './App';
import { Shape } from './Objects/Shape';
import { Point } from './Objects/Point';
import { ShapeManager } from './ShapeManager';

/*
TODO:
    -ajouter des facilités de sélection quand on ne peut sélectionner que
      des segments ou points (par ex).
 */
export class SelectManager {
  static init() {
    window.addEventListener('canvasmousedown', event =>
      'mousedown' == app.workspace.selectionConstraints.eventType
        ? this.selectObject(event.detail.mousePos)
        : null,
    );
    window.addEventListener('canvasclick', event =>
      'click' == app.workspace.selectionConstraints.eventType
        ? this.selectObject(event.detail.mousePos)
        : null,
    );
    window.addEventListener('reset-selection-constrains', () => {
      app.workspace.selectionConstraints = this.getEmptySelectionConstraints();
    });
    window.addEventListener('app-state-changed', () => {
      app.workspace.selectionConstraints = this.getEmptySelectionConstraints();
    });
    let click_all_shape_constr = this.getEmptySelectionConstraints();
    click_all_shape_constr.eventType = 'click';
    click_all_shape_constr.shapes.canSelect = true;
    let mousedown_all_shape_constr = this.getEmptySelectionConstraints();
    mousedown_all_shape_constr.eventType = 'mousedown';
    mousedown_all_shape_constr.shapes.canSelect = true;
    app.fastSelectionConstraints = {
      click_all_shape: click_all_shape_constr,
      mousedown_all_shape: mousedown_all_shape_constr,
    };
  }

  /**
   * Vérifier si 2 points sont à la distance de sélection l'un de l'autre.
   * @param  {Point} pt1 premier point
   * @param  {Point} pt2 second point
   * @return {Boolean}     true si oui, false si non.
   */
  static arePointsInSelectionDistance(pt1, pt2) {
    let dist = pt1.dist(pt2);
    return dist <= app.settings.get('selectionDistance');
  }

  /**
   * Vérifier si 2 points sont à la distance de magnétisme l'un de l'autre.
   * @param  {Point} pt1 premier point
   * @param  {Point} pt2 second point
   * @return {Boolean}     true si oui, false si non.
   */
  static arePointsInMagnetismDistance(pt1, pt2) {
    let dist = pt1.dist(pt2);
    return dist <= app.settings.get('magnetismDistance');
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
        //Liste de Shape. La forme doit être dans ce tableau s'il est non null
        whitelist: null,
        //Liste de Shape. La forme ne doit pas être dans ce tableau s'il est non null
        blacklist: null,
      },
      segments: {
        canSelect: false,
        /*
                Liste pouvant contenir différents éléments:
                    - Shape. Le segment doit faire partie de cette forme ;
                    - {'shape': Shape, 'index': int}. Le segment doit faire
                      partie de cette forme et doit avoir l'index index (dans
                      buildSteps).
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
        types: ['center', 'vertex', 'segmentPoint'],
        /*
                Liste pouvant contenir différents éléments:
                    - Shape. Le point doit faire partie de cette forme ;
                    - {'shape': Shape, 'type': 'center'}. Le point doit être le
                      centre de la forme donnée.
                    - {'shape': Shape, 'type': 'vertex'}. Le point doit être un
                      sommet de la forme donnée.
                    - {'shape': Shape, 'type': 'vertex', index: int}. Le point
                      doit être le sommet d'index index de la forme donnée.
                    - {'shape': Shape, 'type': 'segmentPoint'}. Le point doit
                      être un point de segment de la forme donnée.
                    - {'shape': Shape, 'type': 'segmentPoint', index: int}.
                      Le point doit être un point de segment de la forme donnée,
                      et l'index du segment doit être index.
                    - {'shape': Shape, 'type': 'segmentPoint', index: int, coordinates: Point}.
                      Le point doit être un point de segment de la forme donnée,
                      dont le segment est d'index index et dont les
                      coordonnées sont coordinates (coordonnées relatives).
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
   * @return {Point}
   */
  static selectPoint(mouseCoordinates, constraints, easySelection = true) {
    if (!constraints.canSelect) return null;

    let distCheckFunction = easySelection
      ? this.arePointsInSelectionDistance
      : this.arePointsInMagnetismDistance;

    // all points at the correct distance
    let potentialPoints = [];
    app.workspace.shapes.forEach(shape => {
      if (constraints.types.includes('vertex') && !shape.isCircle()) {
        shape.vertexes
          .filter(vertex => distCheckFunction(vertex, mouseCoordinates))
          .forEach(vertex => {
            potentialPoints.push(vertex);
          });
      }
      if (constraints.types.includes('segmentPoint')) {
        shape.segmentPoints
          .filter(point => distCheckFunction(point, mouseCoordinates))
          .forEach(point => {
            potentialPoints.push(point);
          });
      }
      if (
        shape.isCenterShown &&
        constraints.types.includes('center') &&
        distCheckFunction(shape.center, mouseCoordinates)
      ) {
        potentialPoints.push(shape.center);
      }
    });

    // apply constrains
    const constrainedPoints = potentialPoints.filter(potentialPoint => {
      const shape = potentialPoint.shape;
      if (constraints.whitelist != null) {
        if (
          !constraints.whitelist.some(constr => {
            if (constr instanceof Shape) return constr.id == shape.id;
            else {
              if (constr.shape.id != shape.id) return false;
              if (constr.type == 'center') return potentialPoint.type == 'center';
              if (constr.type == 'vertex')
                return (
                  potentialPoint.type == 'vertex' &&
                  (constr.index == undefined || constr.index == potentialPoint.segment.idx)
                );
              if (constr.type == 'segmentPoint')
                return (
                  potentialPoint.type == 'segmentPoint' &&
                  (constr.index == undefined || constr.index == potentialPoint.segment.idx) &&
                  (constr.coordinates == undefined || constr.coordinates.equal(potentialPoint))
                );
            }
          })
        )
          return false;
      }
      if (constraints.blacklist != null) {
        if (
          constraints.blacklist.some(constr => {
            if (constr instanceof Shape) return constr.id == shape.id;
            else {
              if (constr.shape.id != shape.id) return false;
              if (constr.type == 'center') return potentialPoint.type == 'center';
              if (constr.type == 'vertex')
                return (
                  potentialPoint.type == 'vertex' &&
                  (constr.index == undefined || constr.index == potentialPoint.segment.idx)
                );
              if (constr.type == 'segmentPoint')
                return (
                  potentialPoint.type == 'segmentPoint' &&
                  (constr.index == undefined || constr.index == potentialPoint.segment.idx) &&
                  constr.coordinates.equal(potentialPoint)
                );
            }
          })
        )
          return false;
      }
      return true;
    });

    // if no possibilities
    if (constrainedPoints.length == 0) return null;

    // sort by distance and height
    // cree un tableau de type [ [{Point}, {Point}], [{Point}]]
    // avec meme distance dans meme case
    let sortedPoints = [];
    constrainedPoints.forEach(pt => {
      const dist = pt.dist(mouseCoordinates);
      for (const key in sortedPoints) {
        const comparedDist = sortedPoints[key][0].dist(mouseCoordinates);
        if (Math.abs(dist - comparedDist) < 0.1) {
          // 0.1 pour distance égale
          sortedPoints[key].push(pt);
          return 'pushed';
        }
      }
      sortedPoints.push([pt]);
    });
    // sort by distance
    sortedPoints.sort(
      (pts1, pts2) => pts1[0].dist(mouseCoordinates) - pts2[0].dist(mouseCoordinates),
    );
    // sort by height
    sortedPoints.forEach(toSort =>
      toSort.sort((pt1, pt2) =>
        ShapeManager.getShapeIndex(pt1.shape) < ShapeManager.getShapeIndex(pt2.shape) ? 1 : -1,
      ),
    );

    const flattedPoints = sortedPoints.flat();

    // calculate the best point
    if (constraints.blockHidden) {
      const shapes = ShapeManager.shapesOnPoint(mouseCoordinates);
      for (const pt of flattedPoints) {
        const thisIndex = ShapeManager.getShapeIndex(pt.shape);
        if (
          shapes.some(s => {
            let otherIndex = ShapeManager.getShapeIndex(s);
            return otherIndex > thisIndex;
          })
        )
          // point behind shape
          continue;
        return pt;
      }
      // all points behind other shapes
      return null;
    } else {
      return flattedPoints[0];
    }
  }

  /**
   * Essaie de sélectionner un segment, en fonction des contraintes données.
   * Renvoie null si pas de segment.
   * @param  {Point} mouseCoordinates
   * @param  {Object} constraints      Contraintes. Voir selectionConstraints.segments.
   * @return {Segment}
   */
  static selectSegment(mouseCoordinates, constraints) {
    if (!constraints.canSelect) return null;

    // all segments at the correct distance
    let potentialSegments = [];
    app.workspace.shapes.forEach(shape => {
      shape.segments
        .filter(segment => {
          const projection = segment.projectionOnSegment(mouseCoordinates);
          return (
            segment.isPointOnSegment(projection) &&
            this.arePointsInSelectionDistance(projection, mouseCoordinates)
          );
        })
        .forEach(segment => {
          potentialSegments.push({
            segment: segment,
            dist: segment.projectionOnSegment(mouseCoordinates).dist(mouseCoordinates),
          });
        });
    });

    // apply constrains
    const constrainedSegments = potentialSegments.filter(potentialSegment => {
      const shape = potentialSegment.shape;
      if (constraints.whitelist != null) {
        if (
          !constraints.whitelist.some(constr => {
            if (constr instanceof Shape) return constr.id == shape.id;
            else {
              if (constr.shape.id != shape.id) return false;
              return constr.index == potentialSegment.segment.idx;
            }
          })
        )
          return false;
      }
      if (constraints.blacklist != null) {
        if (
          constraints.blacklist.some(constr => {
            if (constr instanceof Shape) return constr.id == shape.id;
            else {
              if (constr.shape.id != shape.id) return false;
              return constr.index == potentialSegment.segment.idx;
            }
          })
        )
          return false;
      }
      return true;
    });

    // if no possibilities
    if (constrainedSegments.length == 0) return null;

    // sort by distance and height
    // cree un tableau de type [ [{Point}, {Point}], [{Point}]]
    // avec meme distance dans meme case
    let sortedSegments = [];
    constrainedSegments.forEach(seg => {
      const dist = seg.dist;
      for (const key in sortedSegments) {
        const comparedDist = sortedSegments[key].dist;
        if (Math.abs(dist - comparedDist) < 0.1) {
          // 0.1 pour distance égale
          sortedSegments[key].push(seg);
          return 'pushed';
        }
      }
      sortedSegments.push([seg]);
    });
    // sort by distance
    sortedSegments.sort((segs1, segs2) => segs1[0].dist - segs2[0].dist);
    // sort by height
    sortedSegments.forEach(toSort =>
      toSort.sort((seg1, seg2) => {
        ShapeManager.getShapeIndex(seg1.shape) < ShapeManager.getShapeIndex(seg2.shape) ? 1 : -1;
      }),
    );

    const flattedSegments = sortedSegments.flat();

    // no possibilities to choose blockHidden constraints
    return flattedSegments[0].segment;
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

    let shapes = ShapeManager.shapesOnPoint(mouseCoordinates);

    if (constraints.whitelist != null) {
      shapes = shapes.filter(shape => {
        return constraints.whitelist.some(shape2 => {
          return shape.id == shape2.id;
        });
      });
    }

    if (constraints.blacklist != null) {
      shapes = shapes.filter(shape => {
        return constraints.blacklist.every(shape2 => {
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
          return this.selectPoint(mCoord, constr);
        },
        segments: (mCoord, constr) => {
          return this.selectSegment(mCoord, constr);
        },
        shapes: (mCoord, constr) => {
          return this.selectShape(mCoord, constr);
        },
      };

    //Vérification que priority est bien défini
    if (
      !constr.priority.every(p => {
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
