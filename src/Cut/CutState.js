import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { mod, uniqId } from '../Core/Tools/general';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';

/**
 * Découper une forme
 */
export class CutState extends State {
  constructor() {
    super('cut', 'Découper', 'operation');

    // listen-canvas-click -> select-second-point -> select-third-point -> showing-points
    this.currentStep = null;

    this.timeoutRef = null;

    this.shape = null;

    this.firstPoint = null;

    this.secondPoint = null;

    this.centerPoint = null;

    this.drawColor = '#E90CC8';
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
        découper une forme en deux nouvelles formes, tout en laissant la forme
        d'origine intacte.<br /><br />

        Pour découper une forme, touchez un premier sommet de la forme, puis
        éventuellement le centre de la forme (non obligatoire), et enfin un
        second sommet de la forme.<br /><br />

        <b>Note:</b> il n'est pas toujours possible de découper une forme en
        sélectionnant deux sommets quelconques. La ligne de découpe doit en
        effet rester à l'intérieur de la forme, sans quoi la découpe ne sera pas
        réalisée.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    setTimeout(() => this.setSelConstraints(this.currentStep));

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(() => this.setSelConstraints(this.currentStep));

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    window.clearTimeout(this.timeoutRef);
    if (this.status != 'paused' || this.currentStep == 'showing-points')
      this.currentStep = 'listen-canvas-click';

    app.removeListener('objectSelected', this.objectSelectedId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un point a été sélectionnée (click)
   * @param  {Object} object            L'élément sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object) {
    if (this.currentStep == 'listen-canvas-click') {
      //On a sélectionné le premier point
      this.shape = object.shape;
      this.firstPoint = object;
      if (this.shape.isSegment() && this.firstPoint.type == 'segmentPoint') {
        this.currentStep = 'showing-points';
        this.secondPoint = null;
        window.clearTimeout(this.timeoutRef);
        this.timeoutRef = window.setTimeout(() => {
          this.execute();
        }, 500);
      } else {
        this.currentStep = 'select-second-point';
        this.setSelConstraints(this.currentStep);
      }
    } else if (this.currentStep == 'select-second-point') {
      const pt1 = this.firstPoint,
        pt2 = object;
      if (pt2.type == 'center') {
        // On a sélectionné le second point: le centre
        if (!this.isLineValid(pt2.shape, pt1, pt2)) return;
        this.centerPoint = pt2;
        this.currentStep = 'select-third-point';
        this.setSelConstraints(this.currentStep);
      } else if (pt1.equal(pt2, 0.001)) {
        // Désélectionner le premier point
        this.shape = null;
        this.firstPoint = null;
        this.currentStep = 'listen-canvas-click';
        this.setSelConstraints(this.currentStep);
      } else if (this.isLineValid(pt2.shape, pt1, pt2)) {
        // On a sélectionné le second point: un autre point
        this.secondPoint = pt2;
        this.centerPoint = null;
        this.currentStep = 'showing-points';
        window.clearTimeout(this.timeoutRef);
        this.timeoutRef = window.setTimeout(() => {
          this.execute();
        }, 500);
      }
    } else if (this.currentStep == 'select-third-point') {
      const pt1 = this.firstPoint,
        pt2 = object;
      //On a sélectionné le dernier point
      if (pt2.pointType == 'center') {
        // Désélectionner le centre
        this.centerPoint = null;
        this.currentStep = 'select-second-point';
        this.setSelConstraints(this.currentStep);
      } else if (pt1.equal(pt2, 0.001)) {
        // Désélectionner le premier point et le centre
        this.shape = null;
        this.firstPoint = null;
        this.centerPoint = null;
        this.currentStep = 'listen-canvas-click';
        this.setSelConstraints(this.currentStep);
      } else if (this.isLineValid(pt2.shape, this.centerPoint, pt2)) {
        this.secondPoint = pt2;
        this.currentStep = 'showing-points';
        window.clearTimeout(this.timeoutRef);
        this.timeoutRef = window.setTimeout(() => {
          this.execute();
        }, 500);
      }
    }
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  execute() {
    this.actions = [
      {
        name: 'CutAction',
        shapeId: this.shape.id,
        firstPoint: this.firstPoint,
        secondPoint: this.secondPoint,
        centerPoint: this.centerPoint,
        createdShapesIds: [uniqId(), uniqId()],
      },
    ];
    this.executeAction();
    this.currentStep = 'listen-canvas-click';
    this.restart();

    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  draw() {
    if (this.currentStep == 'select-second-point') {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.firstPoint, color: this.drawColor, size: 2 },
        })
      );
    } else if (this.currentStep == 'select-third-point') {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.firstPoint, color: this.drawColor, size: 2 },
        })
      );
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.centerPoint, color: this.drawColor, size: 2 },
        })
      );
    } else if (this.currentStep == 'showing-points') {
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: { point: this.firstPoint, color: this.drawColor, size: 2 },
        })
      );
      if (this.secondPoint)
        window.dispatchEvent(
          new CustomEvent('draw-point', {
            detail: { point: this.secondPoint, color: this.drawColor, size: 2 },
          })
        );
      if (this.centerPoint)
        window.dispatchEvent(
          new CustomEvent('draw-point', {
            detail: { point: this.centerPoint, color: this.drawColor, size: 2 },
          })
        );
    }
  }

  /**
   * Vérifie si le segment de droite reliant pt1 et pt2 reste bien à
   * l'intérieur de la forme ou non, qu'il y a au moins un point de ce
   * segment qui n'est pas au bord de la forme, et qu'il n'intersecte pas
   * un segment 'interne' formé par une merge sans tous les segments
   * qui collent parfaitement.
   * Vérifie également qu'il n'y a pas un autre sommet de la forme sur cette
   * droite.
   * @param  {Shape}  shape
   * @param  {Point}  pt1  coordonnées du point 1
   * @param  {Point}  pt2  coordonnées du point 2
   * @return {Boolean}     Retourne false s'il sort de la forme.
   */
  isLineValid(shape, pt1, pt2) {
    let length = pt1.dist(pt2),
      part = pt2.subCoordinates(pt1).multiplyWithScalar(1 / length),
      precision = 1, // px
      amountOfParts = length / precision,
      pointsInBorder = 0;
    for (let i = 1; i < amountOfParts; i++) {
      let pt = pt1.addCoordinates(part.multiplyWithScalar(i, false));
      if (!shape.isPointInPath(pt)) return false;
      pointsInBorder += shape.isPointInBorder(pt) ? 1 : 0;
    }
    if (pointsInBorder > 40 * precision) return false;
    const junction = new Segment(pt1, pt2);
    if (shape.segments.some(seg => seg.doesIntersect(junction, false, true)))
      return false;

    return shape.vertexes.every(
      vertex =>
        vertex.equal(pt1) ||
        vertex.equal(pt2) ||
        !new Segment(pt1, pt2).isPointOnSegment(vertex)
    );
  }

  setSelConstraints(step) {
    window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    if (step == 'listen-canvas-click') {
      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'segmentPoint',
      ];
      app.workspace.selectionConstraints.points.whitelist = null;
      app.workspace.selectionConstraints.points.blacklist = null;
    } else if (step == 'select-second-point') {
      let object = this.firstPoint,
        shape = object.shape,
        segments = shape.segments;

      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'segmentPoint',
        'center',
      ];
      app.workspace.selectionConstraints.points.whitelist = [shape];

      //blacklist
      let vertexToAdd = [],
        segmentsToAdd = [];

      if (!object.segment.arcCenter) segmentsToAdd.push(object.segment.idx);
      if (object.type == 'vertex') {
        const nextSeg = mod(object.segment.idx + 1, segments.length);
        if (!segments[nextSeg].arcCenter) {
          segmentsToAdd.push(nextSeg);
          vertexToAdd.push(nextSeg);
        }
      } else if (!object.segment.arcCenter)
        vertexToAdd.push(object.segment.idx);
      let list = vertexToAdd.map(vertex => {
        return {
          shape: shape,
          type: 'vertex',
          index: vertex,
        };
      });
      list = list.concat(
        segmentsToAdd
          .map(segIdx => {
            return segments[segIdx].points
              .filter(pt => !pt.equal(object))
              .map(pt => {
                return {
                  shape: shape,
                  type: 'segmentPoint',
                  index: segIdx,
                  coordinates: new Point(pt),
                };
              });
          })
          .flat()
      );
      app.workspace.selectionConstraints.points.blacklist = list;
    } else if (step == 'select-third-point') {
      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'segmentPoint',
        'center',
      ];
      app.workspace.selectionConstraints.points.whitelist = null;
      app.workspace.selectionConstraints.points.blacklist = null;
    }
  }
}
