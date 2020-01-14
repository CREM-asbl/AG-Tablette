import { app } from './App';
import { Shape } from './Objects/Shape';
import { Point } from './Objects/Point';

/*
TODO:
    -ajouter des facilités de sélection quand on ne peut sélectionner que
      des segments ou points (par ex).
 */

/*
Cette classe reçoit les événements du canvas. Son comportement par défaut est:
-transmettre les événements aux états permanents de l'application
    ->un état permanent peut bloquer l'envoi des événements suivants aux autres
      états, jusqu'à ce qu'il annule le bloquage. Une fois le bloquage annulé,
      les événements reçus les 200 millisecondes suivantes ne sont pas traités*.
-transmettre l'événement à l'état courant de l'application
-si l'état a configuré la classe correctement, elle vérifie si un objet (forme,
 segment ou point -> contraintes à définir par l'état) se trouve à la position
 de la souris lors de la réception d'un événement. Si oui, l'objet en question
 est transmis à l'état courant (state.objectSelected(Object)).



*: si un état permanent reçoit un onMouseUp, termine son action puis annule le
   bloquage, l'événement onClick (généré juste après le mouseUp) sera envoyé
   à l'état courant, ce qui n'est pas le comportement souhaité (-> au moins 10
   millisecondes). Ou si l'utilisateur a encore un doigt sur l'écran au moment
   où le bloquage est annulé, cela peut également provoquer des comportements
   non souhaités (-> au moins 200 millisecondes?).

 */
export class InteractionAPI {
  constructor() {
    /*
        True: transmet les événements à l'état courant (appelle onClick,
        onMouseMove, onMouseDown et onMouseUp).
         */
    this.forwardEventsToState = true;

    /*
        True: appeler state.objectSelected avant onClick/onMouseDown (par
        défaut: après).
         */
    this.selectObjectBeforeNativeEvent = false;

    /*
        Contraintes sur ce que l'on peut sélectionner comme objet (forme,
        segment et/ou point). Voir this.getEmptySelectionConstraints()
         */
    this.selectionConstraints = null;
    this.resetSelectionConstraints();

    /*
        True: les événements ne sont pas transmis à l'état courant ni à
        l'ensemble des états permanents de l'application, mais uniquement à
        l'état permanent this.permanentStateRef.
         */
    this.permanentStatehasFocus = false;
    this.permanentStateRef = null;

    /*
        Timestamp auquel releaseFocus() a été appelé pour la dernière fois.
         */
    this.permanenteStateFocusReleaseTime = 0;

    window.addEventListener('canvasmousedown', event =>
      'mousedown' == this.selectionConstraints.eventType
        ? this.selectObject(event.detail.mousePos)
        : null,
    );
    window.addEventListener('canvasclick', event =>
      'click' == this.selectionConstraints.eventType
        ? this.selectObject(event.detail.mousePos)
        : null,
    );
  }

  // /**
  //  * Peut être appelé par un état permanent pour être le seul état à recevoir
  //  * les événements suivants.
  //  * @param  {State} permanentStateRef L'état
  //  */
  // getFocus(permanentStateRef) {
  //   if (this.permanentStatehasFocus) {
  //     //Ne devrait pas arriver
  //     console.log('another sate already has focus');
  //     return false;
  //   }
  //   this.permanentStatehasFocus = true;
  //   this.permanentStateRef = permanentStateRef;
  //   if (app.state) app.state.abort();
  // }

  // /**
  //  * Peut être appelé par l'état permanent ayant appelé getFocus(), pour
  //  * terminer le bloquage des événements aux autres états.
  //  * Le bloquage ne sera réellement effectué que 200 millisecondes après.
  //  * @return {[type]} [description]
  //  */
  // releaseFocus() {
  //   this.permanentStatehasFocus = false;
  //   this.permanentStateRef = null;
  //   this.permanenteStateFocusReleaseTime = Date.now();
  // }

  /**
   * Vérifier si 2 points sont à la distance de sélection l'un de l'autre.
   * @param  {Point} pt1 premier point
   * @param  {Point} pt2 second point
   * @return {Boolean}     true si oui, false si non.
   */
  arePointsInSelectionDistance(pt1, pt2) {
    let dist = pt1.dist(pt2);
    return dist <= app.settings.get('selectionDistance');
  }

  /**
   * Vérifier si 2 points sont à la distance de magnétisme l'un de l'autre.
   * @param  {Point} pt1 premier point
   * @param  {Point} pt2 second point
   * @return {Boolean}     true si oui, false si non.
   */
  arePointsInMagnetismDistance(pt1, pt2) {
    let dist = pt1.dist(pt2);
    return dist <= app.settings.get('magnetismDistance');
  }

  /* #################################################################### */
  /* ############################# SÉLECTION ############################ */
  /* #################################################################### */

  /**
   * Renvoie un objet de configuration des contraintes de sélection.
   * @return {Object}
   */
  getEmptySelectionConstraints() {
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
   * Définir les contraintes de sélection
   * @param {Object} constr Voir this.getEmptySelectionConstraints()
   */
  setSelectionConstraints(constr) {
    this.selectionConstraints = constr;
  }

  setFastSelectionConstraints(instruction) {
    if (instruction == 'click_all_shape') {
      let constr = this.getEmptySelectionConstraints();
      constr.eventType = 'click';
      constr.shapes.canSelect = true;
      this.setSelectionConstraints(constr);
      return;
    }
    if (instruction == 'mousedown_all_shape') {
      let constr = this.getEmptySelectionConstraints();
      constr.eventType = 'mousedown';
      constr.shapes.canSelect = true;
      this.setSelectionConstraints(constr);
      return;
    }
    console.error('instruction not valid');
  }

  /**
   * Désactive la sélection.
   */
  resetSelectionConstraints() {
    this.setSelectionConstraints(this.getEmptySelectionConstraints());
  }

  /**
   * Essaie de sélectionner un point, en fonction des contraintes données.
   * Renvoie null si pas de point.
   * @param  {Point} mouseCoordinates
   * @param  {Object} constraints      Contraintes. Voir selectionConstraints.points.
   * @return {Point}
   */
  selectPoint(mouseCoordinates, constraints, easySelection = true) {
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
        app.workspace.getShapeIndex(pt1.shape) < app.workspace.getShapeIndex(pt2.shape) ? 1 : -1,
      ),
    );

    const flattedPoints = sortedPoints.flat();

    // calculate the best point
    if (constraints.blockHidden) {
      const shapes = app.workspace.shapesOnPoint(mouseCoordinates);
      for (const pt of flattedPoints) {
        const thisIndex = app.workspace.getShapeIndex(pt.shape);
        if (
          shapes.some(s => {
            let otherIndex = app.workspace.getShapeIndex(s);
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
  selectSegment(mouseCoordinates, constraints) {
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
        app.workspace.getShapeIndex(seg1.shape) < app.workspace.getShapeIndex(seg2.shape) ? 1 : -1;
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
  selectShape(mouseCoordinates, constraints) {
    if (!constraints.canSelect) return null;

    let shapes = app.workspace.shapesOnPoint(mouseCoordinates);

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
  selectObject(mouseCoordinates) {
    let constr = this.selectionConstraints,
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

  /* #################################################################### */
  /* ############################ ÉVÉNEMENTS ############################ */
  /* #################################################################### */

  /**
   * Stocker la dernière position connue de la souris.
   * @param  {Point} mouseCoordinates Coordonnées de la souris
   */
  updateLastKnownMouseCoordinates(mouseCoordinates) {
    app.drawAPI.lastKnownMouseCoordinates = {
      x: mouseCoordinates.x,
      y: mouseCoordinates.y,
    };
  }

  // /**
  //  * Traiter un événement reçu. Événements attendus: click, mousedown, mouseup,
  //  * mousemove, touchstart, touchmove, touchend, touchcancel, touchleave.
  //  * @param  {String} eventName        Nom de l'événement (ex: 'click',
  //  *                                    'mousedown'...)
  //  * @param  {String} fName            Nom de la fonction gérant l'événement
  //  *                                   (ex: 'onClick', 'onMouseDown'...)
  //  * @param  {Point} mouseCoordinates Coordonnées de la souris
  //  * @param  {Event} event            Référence vers l'événement javascript.
  //  */
  // processEvent(eventName, fName, mouseCoordinates, event) {
  //   eventName = eventName.toLowerCase();
  //   this.updateLastKnownMouseCoordinates(mouseCoordinates);
  //   app.permanentStates.forEach(state => {
  //     if (!this.permanentStatehasFocus && state[fName]) state[fName](mouseCoordinates, event);
  //   });
  //   if (this.permanentStatehasFocus) {
  //     if (this.permanentStateRef[fName]) this.permanentStateRef[fName](mouseCoordinates, event);
  //     return;
  //   } else if (Date.now() - this.permanenteStateFocusReleaseTime < 200) return;

  //   let eventResult = true;
  //   if (!this.selectObjectBeforeNativeEvent && this.forwardEventsToState && app.state)
  //     eventResult = app.state[fName](mouseCoordinates, event);

  //   //Sélection d'objets:
  //   let callEvent = true;
  //   if (['click', 'mousedown'].includes(eventName)) {
  //     //Si l'événement a retourné false, on essaie pas de détecter un objet.
  //     if (eventResult && this.selectionConstraints.eventType == eventName) {
  //       let obj = this.selectObject(mouseCoordinates);
  //       if (obj) {
  //         callEvent = app.state.objectSelected(obj, mouseCoordinates, event);
  //       }
  //     }
  //   }

  //   //Si objectSelected a retourné false, on essaie pas d'appeler l'événement.
  //   if (this.selectObjectBeforeNativeEvent && callEvent && this.forwardEventsToState && app.state) {
  //     app.state[fName](mouseCoordinates, event);
  //   }
  // }

  // onClick(mouseCoordinates, event) {
  //   this.processEvent('click', 'onClick', mouseCoordinates, event);
  // }

  // onMouseDown(mouseCoordinates, event) {
  //   this.processEvent('mousedown', 'onMouseDown', mouseCoordinates, event);
  // }

  // onMouseUp(mouseCoordinates, event) {
  //   this.processEvent('mouseup', 'onMouseUp', mouseCoordinates, event);
  // }

  // onMouseMove(mouseCoordinates, event) {
  //   this.processEvent('mousemove', 'onMouseMove', mouseCoordinates, event);
  //   app.drawAPI.askRefresh('upper');
  // }

  // onTouchStart(mouseCoordinates, event) {
  //   if (event.touches.length > 1) return; //TODO: supprimer ?
  //   if (event.cancelable) event.preventDefault();
  //   this.onMouseDown(mouseCoordinates, event);
  // }

  // onTouchMove(mouseCoordinates, event) {
  //   if (event.cancelable) event.preventDefault();
  //   this.onMouseMove(mouseCoordinates, event);
  // }

  // onTouchEnd(mouseCoordinates, event) {
  //   this.onMouseUp(mouseCoordinates, event);
  //   this.onClick(mouseCoordinates, event);
  // }

  // onTouchLeave(mouseCoordinates, event) {
  //   this.onMouseUp(mouseCoordinates, event);
  //   this.onClick(mouseCoordinates, event);
  // }

  // onTouchCancel(mouseCoordinates, event) {
  //   this.onMouseUp(mouseCoordinates, event);
  //   this.onClick(mouseCoordinates, event);
  // }
}
