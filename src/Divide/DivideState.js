import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { createElem } from '../Core/Tools/general';
import { Segment } from '../Core/Objects/Segment';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';

/**
 * Découper un segment (ou partie de segment) en X parties (ajoute X-1 points)
 */
export class DivideState extends State {
  constructor() {
    super('divide', 'Diviser', 'operation');

    // choose-nb-parts -> listen-canvas-click -> select-second-point -> showing-points
    //                                        -> showing-segment
    this.currentStep = null;

    this.timeoutRef = null;

    this.drawColor = '#E90CC8';

    this.numberOfParts = 2;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil permet de
        diviser un segment d'une forme en plusieurs parties (délimitées par des
        points).<br />
        Après avoir choisit en combien de partie vous souhaitez diviser le
        segment, touchez le segment que vous souhaitez diviser.<br />
        Il est également possible de sélectionner deux points situés sur le même
        segment, afin de diviser le segment formé par ces deux points.<br /><br />

        <b>Note:</b> il est également possible de diviser un arc de cercle, soit
        en touchant l'arc lui-même, soit en sélectionnant deux points situés sur
        cet arc. Dans ce dernier cas, la division est effectuée dans le sens
        horlogique.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'choose-nb-parts';
    let popup = createElem('divide-popup');
    popup.parts = this.numberOfParts;

    window.addEventListener('setNumberOfParts', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart(manualRestart = false) {
    this.end();
    if (manualRestart) {
      this.start();
      return;
    }
    if (this.savedSelConstr) {
      app.workspace.selectionConstraints = this.savedSelConstr;
      this.savedSelConstr = null;
    } else {
      this.setSelectionConstraints();
    }

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.addEventListener('setNumberOfParts', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    window.clearTimeout(this.timeoutRef);
    if (this.status != 'paused' || this.currentStep == 'showing-points') {
      this.currentStep = 'listen-canvas-click';
    } else if (!this.savedSelConstr) {
      // paused
      this.savedSelConstr = app.workspace.selectionConstraints;
    }

    app.removeListener('objectSelected', this.objectSelectedId);
    window.removeEventListener('setNumberOfParts', this.handler);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'setNumberOfParts') {
      this.setNumberOfparts(event.detail.nbOfParts);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  setNumberOfparts(parts) {
    this.numberOfParts = parseInt(parts);
    this.currentStep = 'listen-canvas-click';
    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  setSelectionConstraints() {
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.types = [
      'vertex',
      'divisionPoint',
    ];
    if (this.currentStep == 'listen-canvas-click') {
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.blacklist = app.mainDrawingEnvironment.shapes
        .filter(s => s.isStraightLine() || s.isSemiStraightLine())
        .map(s => {
          return { shapeId: s.id };
        });
      app.workspace.selectionConstraints.points.canSelect = true;
      app.workspace.selectionConstraints.points.blacklist = app.mainDrawingEnvironment.shapes
        .filter(s => s.isStraightLine() || s.isSemiStraightLine())
        .map(s => {
          return { shapeId: s.id };
        });
    } else if (this.currentStep == 'select-second-point') {
      app.workspace.selectionConstraints.points.canSelect = true;
      let firstPoint = app.mainDrawingEnvironment.findObjectById(
        this.actions[0].firstPointId,
        'point'
      );
      let segments = firstPoint.segmentIds.map(segId =>
        app.mainDrawingEnvironment.findObjectById(segId, 'segment')
      );
      let potentialPoints = segments.map(seg => seg.vertexes).flat(); // attention, on a 2x firstPoint dans les points potentiels
      // add vertexes to whitelist
      app.workspace.selectionConstraints.points.whitelist = potentialPoints.map(
        pt => {
          return { shapeId: firstPoint.shapeId, type: 'vertex', index: pt.idx };
        }
      );
      // add divisionPoints to whitelist
      app.workspace.selectionConstraints.points.whitelist.push(
        ...segments.map(seg => {
          return {
            shapeId: firstPoint.shapeId,
            type: 'divisionPoint',
            index: seg.idx,
          };
        })
      );
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un point/segment a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (
      this.currentStep != 'listen-canvas-click' &&
      this.currentStep != 'select-second-point'
    )
      return;

    if (this.currentStep == 'listen-canvas-click') {
      if (object instanceof Segment) {
        this.actions = [
          {
            name: 'DivideAction',
            mode: 'segment',
            segmentId: object.id,
          },
        ];

        new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          borderColor: this.drawColor,
          borderSize: 3,
          path: object.getSVGPath('no scale', undefined, true),
          id: undefined,
        });

        this.currentStep = 'showing-segment';
      } else {
        this.actions = [
          {
            name: 'DivideAction',
            mode: 'twoPoints',
            firstPointId: object.id,
          },
        ];
        this.currentStep = 'select-second-point';

        new Point({
          coordinates: object.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: this.drawColor,
          size: 2,
        });

        this.setSelectionConstraints();

        window.dispatchEvent(new CustomEvent('refresh'));
        window.dispatchEvent(new CustomEvent('refreshUpper'));
        return;
      }
    } else {
      // select-second-point
      let pt1 = app.mainDrawingEnvironment.findObjectById(
        this.actions[0].firstPointId,
        'point'
      );

      if (pt1.id == object.id) {
        // pt1 = object => désélectionner le point.
        this.currentStep = 'listen-canvas-click';
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[0].id,
          'point'
        );
        this.actions = null;

        this.setSelectionConstraints();

        window.dispatchEvent(new CustomEvent('refresh'));
        window.dispatchEvent(new CustomEvent('refreshUpper'));
        return;
      } else {
        if (pt1.type == 'vertex' && object.type == 'vertex') {
          /*
              Vérifie s'il y a une ambiguité sur l'action à réaliser: si les 2
              poins sont reliés par un arc de cercle, et aussi par un segment (la
              forme est donc constituée uniquement de 2 sommets, un segment et un
              arc de cercle), on annule l'action.
               */
          if (
            (pt1.segmentIds[0] == object.segmentIds[0] &&
              pt1.segmentIds[1] == object.segmentIds[1]) ||
            (pt1.segmentIds[0] == object.segmentIds[1] &&
              pt1.segmentIds[1] == object.segmentIds[0])
          ) {
            console.warn('ambiguité, ne rien faire');
            this.restart();

            window.dispatchEvent(new CustomEvent('refresh'));
            window.dispatchEvent(new CustomEvent('refreshUpper'));
            return;
          }
        }
        this.actions[0].secondPointId = object.id;
        this.currentStep = 'showing-points';

        new Point({
          coordinates: object.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: this.drawColor,
          size: 2,
        });
      }
    }

    window.clearTimeout(this.timeoutRef);
    this.timeoutRef = window.setTimeout(() => {
      this.execute();
    }, 500);
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  execute() {
    this.actions[0].numberOfParts = this.numberOfParts;
    if (this.actions[0].mode == 'twoPoints') {
      let segment = app.mainDrawingEnvironment.getCommonSegmentOfTwoPoints(
        this.actions[0].firstPointId,
        this.actions[0].secondPointId
      );
      this.actions[0].segmentId = segment.id;
    }
    // this.actions[0].existingPoints = [...this.actions[0].segment.divisionPoints];
    this.executeAction();
    app.upperDrawingEnvironment.removeAllObjects();
    this.restart();

    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }
}
