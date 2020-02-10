import { app } from '../App';
import { State } from './State';
import { Segment } from '../Objects/Segment';

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

    this.numberOfparts = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Diviser';
    return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil
                permet de diviser un segment d'une forme en plusieurs parties
                (délimitées par des points).<br />
                Après avoir choisit en combien de partie vous souhaitez diviser
                le segment, touchez le segment que vous souhaitez diviser.<br />
                Il est également possible de sélectionner deux points situés sur
                le même segment, afin de diviser le segment formé par ces deux
                points.<br /><br />

                <b>Note:</b> il est également possible de diviser un arc de
                cercle, soit en touchant l'arc lui-même, soit en sélectionnant
                deux points situés sur cet arc. Dans ce dernier cas, la division
                est effectuée dans le sens horlogique.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.currentStep = 'choose-nb-parts';
    window.dispatchEvent(new CustomEvent('open-divide-popup'));
    // app.appDiv.shadowRoot.querySelector('divide-popup').style.display = 'block';

    window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.segments.canSelect = true;
    app.workspace.selectionConstraints.points.canSelect = true;
    app.workspace.selectionConstraints.points.types = ['vertex', 'segmentPoint'];

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
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
      window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.points.canSelect = true;
      app.workspace.selectionConstraints.points.types = ['vertex', 'segmentPoint'];
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

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else if (event.type == 'setNumberOfParts') {
      this.setNumberOfparts(event.detail.nbOfParts);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  setNumberOfparts(parts) {
    this.numberOfparts = parseInt(parts);
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un point/segment a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (this.currentStep != 'listen-canvas-click' && this.currentStep != 'select-second-point')
      return;

    if (this.currentStep == 'listen-canvas-click') {
      if (object instanceof Segment) {
        this.actions = [
          {
            name: 'DivideAction',
            mode: 'segment',
            segment: object,
          },
        ];
        this.currentStep = 'showing-segment';
      } else {
        this.actions = [
          {
            name: 'DivideAction',
            mode: 'two_points',
            firstPoint: object,
          },
        ];
        this.currentStep = 'select-second-point';

        //Liste des points que l'on peut sélectionner comme 2ème point:
        let pointsList = this.getCandidatePoints(object);

        app.workspace.selectionConstraints.segments.canSelect = false;
        app.workspace.selectionConstraints.points.whitelist = pointsList;

        window.dispatchEvent(new CustomEvent('refresh'));
        window.dispatchEvent(new CustomEvent('refreshUpper'));
        return;
      }
    } else {
      // select-second-point
      let pt1 = this.actions[0].firstPoint;

      if (
        pt1.type == object.type &&
        pt1.segment.idx == object.segment.idx &&
        (pt1.pointType == 'vertex' || pt1.equal(object))
      ) {
        // pt1 = object => désélectionner le point.
        this.currentStep = 'listen-canvas-click';
        this.actions = null;

        //reset selection constraints:
        app.workspace.selectionConstraints.segments.canSelect = true;
        app.workspace.selectionConstraints.points.whitelist = null;

        window.dispatchEvent(new CustomEvent('refresh'));
        window.dispatchEvent(new CustomEvent('refreshUpper'));
        return;
      } else if (pt1.type == 'vertex' && object.type == 'vertex') {
        /*
            Vérifie s'il y a une ambiguité sur l'action à réaliser: si les 2
            poins sont reliés par un arc de cercle, et aussi par un segment (la
            forme est donc constituée uniquement de 2 sommets, un segment et un
            arc de cercle), on annulle l'action.
             */
        let segments = object.shape.segments;
        if (
          segments.length == 2 &&
          segments[0].contains(pt1) &&
          segments[1].contains(pt1) &&
          segments[0].contains(object) &&
          segments[1].contains(object)
        ) {
          console.log('ambiguité, ne rien faire');
          this.restart();

          window.dispatchEvent(new CustomEvent('refresh'));
          window.dispatchEvent(new CustomEvent('refreshUpper'));
          return;
        } else {
          this.actions[0].secondPoint = object;
          this.currentStep = 'showing-points';
        }
      } else {
        this.actions[0].secondPoint = object;
        this.currentStep = 'showing-points';
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
    this.actions[0].numberOfparts = this.numberOfparts;
    if (this.actions[0].mode == 'two_points') {
      let pt1 = this.actions[0].firstPoint,
        pt2 = this.actions[0].secondPoint;
      if (pt1.type == 'segmentPoint') this.actions[0].segment = pt1.segment;
      else if (pt2.type == 'segmentPoint') this.actions[0].segment = pt2.segment;
      else {
        this.actions[0].segment =
          (Math.abs(pt2.segment.idx - pt1.segment.idx) > 1) ^ // si premier et dernier segment
          (pt1.segment.idx > pt2.segment.idx)
            ? pt1.segment
            : pt2.segment;
      }
    }
    this.actions[0].existingPoints = [...this.actions[0].segment.points];
    this.executeAction();
    this.restart();

    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx) {
    if (this.currentStep == 'select-second-point') {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.actions[0].firstPoint, color: this.drawColor, size: 2 },
        }),
      );
    }
    if (this.currentStep == 'showing-points') {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.actions[0].firstPoint, color: this.drawColor, size: 2 },
        }),
      );
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.actions[0].secondPoint, color: this.drawColor, size: 2 },
        }),
      );
    }
    if (this.currentStep == 'showing-segment') {
      let segment = this.actions[0].segment;

      if (segment.arcCenter) {
        window.dispatchEvent(
          new CustomEvent('draw-arc', {
            detail: {
              startPoint: segment.vertexes[0],
              endPoint: segment.vertexes[1],
              center: segment.arcCenter,
              counterclockwise: segment.counterclockwise,
              color: this.drawColor,
              size: 3,
            },
          }),
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('draw-line', {
            detail: { line: segment, color: this.drawColor, size: 3 },
          }),
        );
      }
    }
  }

  /**
   * Calcule la liste des points que l'on peut sélectionner comme 2ème point
   * @return {[Object]} Liste de points
   */
  getCandidatePoints(object) {
    const shape = object.shape;

    const concerned_segments = object.shape.segments.filter(seg => seg.contains(object));

    let candidates = [];

    concerned_segments.forEach(seg => {
      if (!seg) return;
      object.shape.segments.forEach(segment => {
        const vertex = segment.vertexes[1];
        if (
          seg.contains(vertex) &&
          !candidates.some(candi => candi.type == 'vertex' && candi.index == segment.idx)
        )
          candidates.push({
            shape: shape,
            type: 'vertex',
            index: segment.idx,
          });
      });
      candidates.push({
        shape: shape,
        type: 'segmentPoint',
        index: seg.idx,
      });
    });

    return candidates;
  }
}
