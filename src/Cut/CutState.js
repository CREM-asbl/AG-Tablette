import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
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
    setTimeout(() => this.setSelectionConstraints(this.currentStep));

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(() => this.setSelectionConstraints(this.currentStep));

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
      console.error('unsupported event type : ', event.type);
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
      new Point({
        coordinates: object.coordinates,
        drawingEnvironment: app.upperDrawingEnvironment,
        color: this.drawColor,
        size: 2,
      });
      if (this.shape.isSegment() && this.firstPoint.type == 'divisionPoint') {
        this.currentStep = 'showing-points';
        this.secondPoint = null;
        window.clearTimeout(this.timeoutRef);
        this.timeoutRef = window.setTimeout(() => {
          this.execute();
        }, 500);
      } else {
        this.currentStep = 'select-second-point';
        this.setSelectionConstraints(this.currentStep);
      }
    } else if (this.currentStep == 'select-second-point') {
      const pt1 = this.firstPoint,
        pt2 = object;
      if (pt1.id == pt2.id) {
        // Désélectionner le premier point
        this.shape = null;
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[0].id,
          'point'
        );
        this.firstPoint = null;
        this.currentStep = 'listen-canvas-click';
        this.setSelectionConstraints(this.currentStep);
      } else if (this.isLineValid(pt2.shape, pt1, pt2)) {
        new Point({
          coordinates: object.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: this.drawColor,
          size: 2,
        });
        if (pt2.type == 'center') {
          // On a sélectionné le second point: le centre
          this.centerPoint = pt2;
          this.currentStep = 'select-third-point';
          this.setSelectionConstraints(this.currentStep);
        } else {
          // On a sélectionné le second point: un autre point
          this.secondPoint = pt2;
          this.centerPoint = null;
          this.currentStep = 'showing-points';
          window.clearTimeout(this.timeoutRef);
          this.timeoutRef = window.setTimeout(() => {
            this.execute();
          }, 500);
        }
      }
    } else if (this.currentStep == 'select-third-point') {
      const pt1 = this.firstPoint,
        pt2 = object;
      //On a sélectionné le dernier point
      if (pt2.type == 'center') {
        // Désélectionner le centre
        this.centerPoint = null;
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[1].id,
          'point'
        );
        this.currentStep = 'select-second-point';
        this.setSelectionConstraints(this.currentStep);
      } else if (pt1.id == pt2.id) {
        // Désélectionner le premier point et le centre
        this.shape = null;
        this.firstPoint = null;
        this.centerPoint = null;
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[1].id,
          'point'
        );
        app.upperDrawingEnvironment.removeObjectById(
          app.upperDrawingEnvironment.points[0].id,
          'point'
        );
        this.currentStep = 'listen-canvas-click';
        this.setSelectionConstraints(this.currentStep);
      } else if (this.isLineValid(pt2.shape, this.centerPoint, pt2)) {
        new Point({
          coordinates: object.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: this.drawColor,
          size: 2,
        });
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
        firstPointId: this.firstPoint.id,
        secondPointId: this.secondPoint?.id,
        centerPointId: this.centerPoint?.id,
        // createdShapesIds: [uniqId(), uniqId()],
      },
    ];
    this.executeAction();
    this.currentStep = 'listen-canvas-click';
    app.upperDrawingEnvironment.removeAllObjects();
    this.restart();

    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  // /**
  //  * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
  //  */
  // refreshStateUpper() {
  //   if (this.currentStep == 'select-second-point') {
  //     window.dispatchEvent(
  //       new CustomEvent('draw-point', {
  //         detail: { point: this.firstPoint, color: this.drawColor, size: 2 },
  //       })
  //     );
  //   } else if (this.currentStep == 'select-third-point') {
  //     window.dispatchEvent(
  //       new CustomEvent('draw-point', {
  //         detail: { point: this.firstPoint, color: this.drawColor, size: 2 },
  //       })
  //     );
  //     window.dispatchEvent(
  //       new CustomEvent('draw-point', {
  //         detail: { point: this.centerPoint, color: this.drawColor, size: 2 },
  //       })
  //     );
  //   } else if (this.currentStep == 'showing-points') {
  //     window.dispatchEvent(
  //       new CustomEvent('draw-point', {
  //         detail: { point: this.firstPoint, color: this.drawColor, size: 2 },
  //       })
  //     );
  //     if (this.secondPoint)
  //       window.dispatchEvent(
  //         new CustomEvent('draw-point', {
  //           detail: { point: this.secondPoint, color: this.drawColor, size: 2 },
  //         })
  //       );
  //     if (this.centerPoint)
  //       window.dispatchEvent(
  //         new CustomEvent('draw-point', {
  //           detail: { point: this.centerPoint, color: this.drawColor, size: 2 },
  //         })
  //       );
  //   }
  // }

  /**
   * Vérifie si le segment de droite reliant pt1 et pt2 :
   * - reste bien à l'intérieur de la forme ou non,
   * - ne soit pas confondu (ou en partie confondu) avec un autre segment (au moins 1/5 commun),
   * - ne contient pas un autre sommet de la forme,
   * - n'intersecte pas un autre segment de la forme
   * @param  {Shape}  shape
   * @param  {Point}  pt1  coordonnées du point 1
   * @param  {Point}  pt2  coordonnées du point 2
   * @return {Boolean}     Retourne false s'il sort de la forme.
   */
  isLineValid(shape, pt1, pt2) {
    let length = pt1.coordinates.dist(pt2.coordinates),
      part = pt2.coordinates.substract(pt1.coordinates).multiply(1 / length),
      precision = 1, // px
      amountOfParts = length / precision,
      pointsInBorder = 0;
    for (let i = 1; i < amountOfParts; i++) {
      let coord = pt1.coordinates.add(part.multiply(i));
      if (!shape.isCoordinatesInPath(coord)) return false;
      pointsInBorder += shape.isPointInBorder(coord) ? 1 : 0;
    }
    if (pointsInBorder > amountOfParts / 5) return false;
    const junction = new Segment({
      drawingEnvironment: app.invisibleDrawingEnvironment,
      vertexCoordinates: [pt1.coordinates, pt2.coordinates],
      createFromNothing: true,
    });
    if (shape.segments.some(seg => seg.doesIntersect(junction, false, true)))
      return false;

    return shape.vertexes.every(
      vertex =>
        vertex.coordinates.equal(pt1.coordinates) ||
        vertex.coordinates.equal(pt2.coordinates) ||
        !junction.isCoordinatesOnSegment(vertex.coordinates)
    );
  }

  setSelectionConstraints(step) {
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    if (step == 'listen-canvas-click') {
      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'divisionPoint',
      ];
      app.workspace.selectionConstraints.points.whitelist = null;
      app.workspace.selectionConstraints.points.blacklist = app.workspace.shapes
        .filter(
          s =>
            s.isStraightLine() ||
            s.isSemiStraightLine() ||
            (s.isSegment() && app.environment.name == 'Geometrie')
        )
        .map(s => {
          return { shapeId: s.id };
        });
    } else if (step == 'select-second-point') {
      let shape = this.firstPoint.shape,
        concernedSegments = this.firstPoint.segments;

      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'divisionPoint',
        'center',
      ];
      app.workspace.selectionConstraints.points.whitelist = [
        { shapeId: shape.id },
      ];

      let segmentsToAddToBlacklist = [];

      concernedSegments.forEach(seg => {
        if (!seg.arcCenter) {
          segmentsToAddToBlacklist.push(seg);
        }
      });

      let blacklist = segmentsToAddToBlacklist
        .map(seg =>
          seg.points.map(pt => {
            if (pt.id != this.firstPoint.id) {
              if (pt.type == 'vertex') {
                return {
                  shapeId: shape.id,
                  type: 'vertex',
                  index: pt.idx,
                };
              } else {
                return {
                  shapeId: shape.id,
                  type: 'divisionPoint',
                  index: pt.segments[0].idx,
                  ratio: pt.ratio,
                };
              }
            }
          })
        )
        .flat()
        .filter(pt => pt);
      app.workspace.selectionConstraints.points.blacklist = blacklist;
    } else if (step == 'select-third-point') {
      app.workspace.selectionConstraints.points.types = [
        'vertex',
        'divisionPoint',
        'center',
      ];

      let shape = this.firstPoint.shape;
      app.workspace.selectionConstraints.points.whitelist = [
        { shapeId: shape.id },
      ];
      app.workspace.selectionConstraints.points.blacklist = null;
    }
  }
}
