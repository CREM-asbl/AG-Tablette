import { app } from './App'
import { distanceBetweenPoints } from './Tools/geometry'

/*
TODO:
    -ajouter des facilités de sélection quand on ne peut sélectionner que
      des segments ou points (par ex).
    -contraintes de sélection: ajouter une priorité entre les types d'objets (
     ex: sélectionner un segment si possible (=s'il y en a un sous la souris),
     sinon une forme?).
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
        segment et/ou point).
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
    }

    /**
     * Peut être appelé par un état permanent pour être le seul état à recevoir
     * les événements suivants.
     * @param  {State} permanentStateRef L'état
     */
    getFocus(permanentStateRef) {
        if(this.permanentStatehasFocus) { //Ne devrait pas arriver
            console.log("another sate already has focus");
            return false;
        }
        this.permanentStatehasFocus = true;
        this.permanentStateRef = permanentStateRef;
        app.state.abort();
    }

    /**
     * Peut être appelé par l'état permanent ayant appelé getFocus(), pour
     * terminer le bloquage des événements aux autres états.
     * Le bloquage ne sera réellement effectué que 200 millisecondes après.
     * @return {[type]} [description]
     */
    releaseFocus() {
        this.permanentStatehasFocus = false;
        this.permanentStateRef = null;
        this.permanenteStateFocusReleaseTime = Date.now();
    }

    /**
     * Vérifier si 2 points sont à la distance de magnétisme l'un de l'autre.
     * @param  {Point} pt1 premier point
     * @param  {Point} pt2 second point
     * @return {Boolean}     true si oui, false si non.
     */
    arePointsInMagnetismDistance(pt1, pt2) {
        let dist = distanceBetweenPoints(pt1, pt2);
        if(dist <= app.settings.get("magnetismDistance"))
            return true;
        return false;
    }

    /**
     * Définit les contraintes de sélection d'objets: aucun type d'objet n'est
     * sélectionné (state.objectSelected(Object) ne sera jamais appelé).
     */
    resetSelectionConstraints() {
        this.setSelectionConstraints("click",
            {"canShape": "none", "listShape": []},
            {"canSegment": "none", "listSegment": []},
            {"canPoint": "none", "pointTypes": [], "listPoint": []});
    }

    /**
     * Définir des contraintes pour la sélection d'un élément sur le canvas
     * @param {String} type           "click" ou "mousedown"
     * @param {String} canShape       "all", "some" (définis dans la liste), "notSome" (idem) ou "none"
     * @param {[Shape]} listShape     liste de forme (vide si canShape vaut "all" ou "none")
     * @param {String} canSegment     "all", "some" (définis dans la liste), "notSome" (idem) ou "none"
     * @param {[Segment]} listSegment liste de segments (vide si canSegment vaut "all" ou "none")
     * @param {String} canPoint       "all", "some" (définis dans la liste), "notSome" (idem) ou "none"
     * @param {[String]} pointTypes   liste d'éléments parmi: "vertex", "segmentPoint", "center"
     * @param {[Point]} listPoint     liste de points (vide si canPoint vaut "all" ou "none")
     */
    setSelectionConstraints(type,
        {canShape, listShape},
        {canSegment, listSegment},
        {canPoint, pointTypes, listPoint}) {
        this.selectionConstraints = {
            "type": type,
            "shapes": {
                "canSelect": canShape, //all, some (in the list), notSome (in the list), none
                "list": listShape
            },
            "segments": {
                "canSelect": canSegment,
                "list": listSegment
            },
            "points": {
                "canSelect": canPoint,
                "types": pointTypes, //liste d'éléments: "vertex", "segmentPoint", "center"
                "list": listPoint
            }
        };
    }

    /**
     * Renvoie un point positionné près de la souris, ou null si pas de point
     * @param  {Point} mouseCoordinates Coordonnées de la souris
     * @param  {Boolean} [center=true]       Peut-on sélectionner un centre
     * @param  {Boolean} [vertex=true]       Peut-on sélectionner un sommet
     * @param  {Boolean} [segmentPoint=true] Peut-on sélectionner un point de segment
     * @return {Object}
     *          {
     *              'type': 'point',
     *              'pointType': 'vertex' ou 'segmentPoint' ou 'center',
     *              'shape': Shape,
     *              'segmentEndCoordinates': Point, //Seulement si pointType = segmentPoint
     *              'coordinates': Point
     *          }
     */
    selectPoint(mouseCoordinates, center = true, vertex = true, segmentPoint = true) {
        let point = {
            'dist': 1000000000,
            'coordinates': null,
            'shape': null,
            'pointType': null,
            'segmentEndCoordinates': null
        };
        app.workspace.shapes.forEach(shape => {
            if(center) {
                if(shape.isCenterShown) {
                    let shapeCenter = shape.getAbsoluteCenter();
                    if(this.arePointsInMagnetismDistance(shapeCenter, mouseCoordinates)) {
                        let dist = distanceBetweenPoints(shapeCenter, mouseCoordinates);
                        if(dist<point.dist) {
                            point.dist = dist;
                            point.coordinates = {
                                'x': shapeCenter.x,
                                'y': shapeCenter.y
                            };
                            point.shape = shape;
                            point.pointType = 'center';
                            point.segmentEndCoordinates = null;
                        }
                    }
                }
            }
            shape.buildSteps.forEach(bs => {
                if(bs.type=="vertex" && vertex) {
                    let absCoordinates = {
                        'x': bs.coordinates.x + shape.x,
                        'y': bs.coordinates.y + shape.y
                    };

                    if(this.arePointsInMagnetismDistance(absCoordinates, mouseCoordinates)) {
                        let dist = distanceBetweenPoints(absCoordinates, mouseCoordinates);
                        if(dist<point.dist) {
                            point.dist = dist;
                            point.coordinates = absCoordinates;
                            point.shape = shape;
                            point.pointType = 'vertex';
                            point.segmentEndCoordinates = null;
                        }
                    }
                }
                if(bs.type=="segment" && segmentPoint) {
                    bs.points.forEach(pt => {
                        let absCoordinates = {
                            'x': pt.x + shape.x,
                            'y': pt.y + shape.y
                        };
                        if(this.arePointsInMagnetismDistance(absCoordinates, mouseCoordinates)) {
                            let dist = distanceBetweenPoints(absCoordinates, mouseCoordinates);
                            if(dist<point.dist) {
                                point.dist = dist;
                                point.coordinates = absCoordinates;
                                point.shape = shape;
                                point.pointType = 'segmentPoint';
                                point.segmentEndCoordinates = {
                                    'x': bs.coordinates.x,
                                    'y': bs.coordinates.y
                                };
                            }
                        }
                    });
                }
            });
        });
        if(point.shape) {
            return {
                'type': 'point',
                'pointType': point.pointType,
                'shape': point.shape,
                'segmentEndCoordinates': point.segmentEndCoordinates,
                'coordinates': point.coordinates
            };
        }
        return null;
    }

    /**
     * En fonction des contraintes définies (setSelectionConstraints()),
     * sélectionne un objet se situant sous la souris. Si aucun objet
     * correspondant aux contraintes n'est trouvé, renvoie null.
     * @param  {Point} mouseCoordinates Coordonnées de la souris.
     * @return {Object} 3 possibilités:
     *      -Un objet de type Shape (pour une forme)
     *      -Cet objet (pour un point):
     *          {
     *              'type': 'point',
     *              'pointType': 'vertex' ou 'segmentPoint' ou 'center',
     *              'shape': Shape,
     *              'segmentEndCoordinates': Point, //Seulement si pointType = segmentPoint
     *              'coordinates': Point
     *          }
     *      -Cet objet (pour un segment):
     *          {
     *              'type': 'segment',
     *              'shape': Shape,
     *              'segmentStartCoordinates': Point,
     *              'segmentEndCoordinates': Point
     *          }
     */
    getSelectedObject(mouseCoordinates) {
        let constr = this.selectionConstraints;
        if(constr.shapes.canSelect != "none") {
            let shapes = app.workspace.shapesOnPoint(mouseCoordinates);
            if(constr.shapes.canSelect == "all") {
                if(shapes.length>0)
                    return shapes[ shapes.length - 1];
            } else if(constr.shapes.canSelect == "some") {
                for(let i=shapes.length-1; i>=0; i--) {
                    if(constr.shapes.list.some(s => s.id == shapes[i].id))
                        return shapes[i];
                }
            } else if(constr.shapes.canSelect == "notSome") {
                for(let i=shapes.length-1; i>=0; i--) {
                    if(constr.shapes.list.every(s => s.id != shapes[i].id))
                        return shapes[i];
                }
            } else {
                console.error("bad type!");
            }
        }

        if(constr.segments.canSelect != "none") {
            console.log("todo segment selector");
        }

        if(constr.points.canSelect != "none") {
            let center = constr.points.types.includes("center"),
                vertex = constr.points.types.includes("vertex"),
                segmentPoint = constr.points.types.includes("segmentPoint"),
                point = this.selectPoint(mouseCoordinates, center, vertex, segmentPoint);
            if(point) return point;
            //TODO: pour l'instant, ne tient pas compte de points.list !!!
        }

        return null;
    }

    /**
     * Stocker la dernière position connue de la souris.
     * @param  {Point} mouseCoordinates Coordonnées de la souris
     */
    updateLastKnownMouseCoordinates(mouseCoordinates) {
        app.drawAPI.lastKnownMouseCoordinates = {
            'x': mouseCoordinates.x,
            'y': mouseCoordinates.y
        };
    }

    /**
     * Traiter un événement reçu. Événements attendus: click, mousedown, mouseup,
     * mousemove, touchstart, touchmove, touchend, touchcancel, touchleave.
     * @param  {String} eventName        Nom de l'événement (ex: 'click',
     *                                    'mousedown'...)
     * @param  {String} fName            Nom de la fonction gérant l'événement
     *                                   (ex: 'onClick', 'onMouseDown'...)
     * @param  {Point} mouseCoordinates Coordonnées de la souris
     * @param  {Event} event            Référence vers l'événement javascript.
     */
    processEvent(eventName, fName, mouseCoordinates, event) {
        eventName = eventName.toLowerCase();
        this.updateLastKnownMouseCoordinates(mouseCoordinates);
        app.permanentStates.forEach(state => {
            if(!this.permanentStatehasFocus && state[fName])
                state[fName](mouseCoordinates, event);
        });
        if(this.permanentStatehasFocus) {
            if(this.permanentStateRef[fName])
                this.permanentStateRef[fName](mouseCoordinates, event);
            return;
        } else if(Date.now() - this.permanenteStateFocusReleaseTime < 200)
            return;

        let eventResult = true;
        if(!this.selectObjectBeforeNativeEvent && this.forwardEventsToState && app.state)
            eventResult = app.state[fName](mouseCoordinates, event);

        //Sélection d'objets:
        let callEvent = true;
        if(['click', 'mousedown'].includes(eventName)) {
            //Si l'événement a retourné false, on essaie pas de détecter un objet.
            if(eventResult && this.selectionConstraints.type==eventName) {
                let obj = this.getSelectedObject(mouseCoordinates);
                if(obj) {
                    callEvent = app.state.objectSelected(obj, mouseCoordinates, event);
                }
            }
        }

        //Si objectSelected a retourné false, on essaie pas d'appeler l'événement.
        if(this.selectObjectBeforeNativeEvent && callEvent
           && this.forwardEventsToState && app.state) {
            app.state[fName](mouseCoordinates, event);
        }
    }


    /* #################################################################### */
    /* ############################ ÉVÉNEMENTS ############################ */
    /* #################################################################### */

    onClick(mouseCoordinates, event) {
        this.processEvent('click', 'onClick', mouseCoordinates, event);
    }

    onMouseDown(mouseCoordinates, event) {
        this.processEvent('mousedown', 'onMouseDown', mouseCoordinates, event);
    }

    onMouseUp(mouseCoordinates, event) {
        this.processEvent('mouseup', 'onMouseUp', mouseCoordinates, event);
    }

    onMouseMove(mouseCoordinates, event) {
        this.processEvent('mousemove', 'onMouseMove', mouseCoordinates, event);
        app.drawAPI.askRefresh("upper");
    }

    onTouchStart(mouseCoordinates, event) {
        if (event.touches.length > 1) return; //TODO: supprimer ?
        event.preventDefault();
        this.onMouseDown(mouseCoordinates, event);
    }

    onTouchMove(mouseCoordinates, event) {
        event.preventDefault();
        this.onMouseMove(mouseCoordinates, event);
    }

    onTouchEnd(mouseCoordinates, event) {
        this.onMouseUp(mouseCoordinates, event);
        this.onClick(mouseCoordinates, event);
    }

    onTouchLeave(mouseCoordinates, event) {
        this.onMouseUp(mouseCoordinates, event);
        this.onClick(mouseCoordinates, event);
    }

    onTouchCancel(mouseCoordinates, event) {
        this.onMouseUp(mouseCoordinates, event);
        this.onClick(mouseCoordinates, event);
    }
}
