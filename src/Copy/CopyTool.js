import { html } from 'lit';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

/**
 * Dupliquer une figure
 */
export class CopyTool extends Tool {
  constructor() {
    super('copy', 'Copier', 'operation');

    this.currentStep = null; // listen-canvas-click -> moving-shape

    //coordonnées de la souris lorsque la duplication a commencé
    this.startClickCoordinates = null;

    /*
        L'ensemble des figures liées à la figure sélectionnée, y compris la figure
        elle-même
         */
    this.involvedShapes = [];

    this.translateOffset = new Coordinates({ x: -20, y: -20 });
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Pour copier une figure, appuyez sur la figure et faites glissez votre
        doigt dans une direction sans le relacher. Relachez ensuite votre doigt
        une fois que la nouvelle figure est à la bonne place.<br /><br />
        <b>Attention:</b> si vous appuyez sur une figure puis relachez
        directement, une copie de la figure aura bien été créée, mais à la même
        position que la figure d'origine. Il y a donc deux figures l'une sur
        l'autre.<br /><br />
        <b>Note:</b> la nouvelle figure créée n'est pas liée d'une manière ou
        d'une autre avec la figure d'origine: il s'agit bien d'une copie
        complètement indépendante.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    app.upperCanvasElem.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    app.workspace.selectionConstraints.shapes.blacklist = app.mainCanvasElem.shapes.filter(s => s instanceof SinglePointShape);
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  move() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.upperCanvasElem.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'canvasMouseUp') {
      this.canvasMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une figure a été sélectionnée (canvasMouseDown)
   * @param  shape            La figure sélectionnée
   */
  objectSelected(shape) {
    if (app.tool.currentStep != 'listen') return;

    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);
    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.lastKnownMouseCoordinates = this.startClickCoordinates;

    // sort shape by height
    this.involvedShapes.sort(
      (s1, s2) =>
        ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
    );
    this.drawingShapes = this.involvedShapes.map((s) => {
      let newShape = new s.constructor({
        ...s,
        drawingEnvironment: app.upperCanvasElem,
        path: s.getSVGPath('no scale', false),
        id: undefined,
        divisionPointInfos: s.divisionPoints.map((dp) => {
          return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, color: dp.color };
        }),
        segmentsColor: s.segments.map((seg) => {
          return seg.color;
        }),
        pointsColor: s.points.map((pt) => {
          return pt.color;
        }),
      });
      newShape.translate(this.translateOffset);
      return newShape;
    });

    setState({ tool: { ...app.tool, currentStep: 'move' } });
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep != 'move') return;

    this.translation = app.workspace.lastKnownMouseCoordinates
      .substract(this.startClickCoordinates)
      .add(this.translateOffset);

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() {
    if (app.tool.currentStep == 'move') {
      let transformation = app.workspace.lastKnownMouseCoordinates.substract(
        this.lastKnownMouseCoordinates,
      );

      this.drawingShapes.forEach((s) => s.translate(transformation));

      this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    }
  }

  _executeAction() {
    let shapesList = [];

    this.involvedShapes.forEach((s) => {
      let newShape = new s.constructor({
        ...s,
        drawingEnvironment: app.mainCanvasElem,
        path: s.getSVGPath('no scale', false),
        id: undefined,
        divisionPointInfos: s.divisionPoints.map((dp) => {
          return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, color: dp.color };
        }),
        segmentsColor: s.segments.map((seg) => {
          return seg.color;
        }),
        pointsColor: s.points.map((pt) => {
          return pt.color;
        }),
      });
      if (newShape.name.startsWith('Parallele'))
        newShape.name = newShape.name.slice('Parallele'.length);
      if (newShape.name.startsWith('Perpendicular'))
        newShape.name = newShape.name.slice('Perpendicular'.length);
      if (newShape.geometryObject)
        newShape.geometryObject = new GeometryObject({});
      shapesList.push(newShape);
      newShape.translate(this.translation);
    });

    let transformation = getShapeAdjustment(shapesList, shapesList[0]);

    shapesList.forEach((newShape) => {
      newShape.rotate(
        transformation.rotationAngle,
        shapesList[0].centerCoordinates,
      );
      newShape.translate(transformation.translation);
    });

    //Si nécessaire, créer le userGroup
    if (shapesList.length > 1) {
      let userGroup = new ShapeGroup(0, 1);
      userGroup.shapesIds = shapesList.map((s) => s.id);
      GroupManager.addGroup(userGroup);
    }
  }
}
