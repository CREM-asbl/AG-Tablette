import { html } from 'lit';
import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { SelectManager } from '../Core/Managers/SelectManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Segment } from '../Core/Objects/Segment';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { addInfoToId, findObjectById } from '../Core/Tools/general';
import { computeAllShapeTransform } from '../GeometryTools/recomputeShape';

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

    this.shapeMoved = 0;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    const toolName = this.title;
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

  start() {
    setTimeout(
      () =>
        setState({
          tool: { ...app.tool, name: this.name, currentStep: 'listen' },
        }),
      50,
    );
  }

  listen() {
    this.shapeMoved = 0;
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    const constraints = SelectManager.getEmptySelectionConstraints();
    constraints.eventType = 'mousedown';
    constraints.shapes.canSelect = true;
    constraints.shapes.blacklist = app.mainCanvasLayer.shapes.filter(
      (s) => s instanceof SinglePointShape,
    );
    constraints.segments.canSelect = true;
    constraints.segments.blacklist = app.mainCanvasLayer.shapes
      .filter((s) => s instanceof LineShape)
      .map((s) => {
        return { shapeId: s.id };
      });
    constraints.priority = ['points', 'shapes', 'segments'];
    app.workspace.selectionConstraints = constraints;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  move() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  objectSelected(object) {
    if (app.tool.currentStep != 'listen') return;
    if (!object) return;

    if (object instanceof Segment) {
      this.mode = 'segment';

      this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
      this.lastKnownMouseCoordinates = this.startClickCoordinates;

      this.involvedSegment = object;

      const newShape = new LineShape({
        layer: 'upper',
        path: object.getSVGPath('no scale', true),
        id: undefined,
        segmentsColor: [object.color],
        pointsColor: object.points
          .filter((pt) => pt.type != 'divisionPoint')
          .map((pt) => {
            return pt.color;
          }),
        geometryObject: new GeometryObject({}),
      });
      this.selectedShape = newShape;
      this.shapesToMove = [this.selectedShape];
      newShape.translate(this.translateOffset);

      this.drawingShapes = [newShape];
    } else {
      this.mode = 'shape';
      this.selectedShape = object;
      this.involvedShapes = ShapeManager.getAllBindedShapes(object);
      for (let i = 0; i < this.involvedShapes.length; i++) {
        const currentShape = this.involvedShapes[i];
        if (currentShape.name == 'Vector') {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: {
                message:
                  'Les vecteurs ne peuvent pas être copiés, mais peuvent être multipliés.',
              },
            }),
          );
          return;
        }
      }

      this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
      this.lastKnownMouseCoordinates = this.startClickCoordinates;

      // sort shape by height
      this.involvedShapes.sort(
        (s1, s2) =>
          ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
      );
      this.drawingShapes = this.involvedShapes.map((s) => {
        const newShape = new s.constructor({
          ...s,
          layer: 'upper',
          path: s.getSVGPath('no scale', false),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points
            .filter((pt) => pt.type != 'divisionPoint')
            .map((pt) => {
              return pt.color;
            }),
        });
        newShape.vertexes.forEach(
          (vx, idx) => (vx.visible = s.vertexes[idx].visible),
        );
        newShape.translate(this.translateOffset);
        return newShape;
      });
      this.shapesToMove = this.drawingShapes;
    }

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

  refreshStateUpper() {
    if (app.tool.currentStep == 'move') {
      this.shapeMoved++;
      if (this.shapeMoved <= 10) return;
      const mainShape = findObjectById(
        addInfoToId(this.selectedShape.id, 'upper'),
      );
      const translation = app.workspace.lastKnownMouseCoordinates.substract(
        this.lastKnownMouseCoordinates,
      );

      this.shapesToMove.forEach((s) => {
        if (this.lastAdjusment) {
          s.translate(
            Coordinates.nullCoordinates.substract(
              this.lastAdjusment.translation,
            ),
          );
          s.rotate(
            this.lastAdjusment.rotationAngle * -1,
            this.lastAdjusment.centerCoord,
          );
        }
        s.translate(translation);
      });

      const adjustment = getShapeAdjustment(this.shapesToMove, mainShape);
      this.lastAdjusment = {
        ...adjustment,
        centerCoord: new Coordinates(mainShape.centerCoordinates),
      };
      this.shapesToMove.forEach((s) => {
        s.rotate(adjustment.rotationAngle, this.lastAdjusment.centerCoord);
        s.translate(adjustment.translation);
      });
      this.shapesToMove.forEach((s) => {
        computeAllShapeTransform(s, 'upper', false);
      });

      this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;

      // let transformation = app.workspace.lastKnownMouseCoordinates.substract(
      //   this.lastKnownMouseCoordinates,
      // );

      // this.drawingShapes.forEach((s) => s.translate(transformation));

      // this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    }
  }

  _executeAction() {
    const shapesList = [];

    if (this.mode == 'segment') {
      const newShape = new LineShape({
        layer: 'main',
        familyName: 'copy',
        path: this.involvedSegment.getSVGPath('no scale', true),
        id: undefined,
        segmentsColor: [this.involvedSegment.color],
        pointsColor: this.involvedSegment.points
          .filter((pt) => pt.type != 'divisionPoint')
          .map((pt) => {
            return pt.color;
          }),
        geometryObject: new GeometryObject({}),
      });

      shapesList.push(newShape);
      newShape.translate(this.translation);
    } else {
      this.involvedShapes.forEach((s) => {
        const newShape = new s.constructor({
          ...s,
          layer: 'main',
          familyName: 'copy',
          path: s.getSVGPath('no scale', false),
          id: undefined,
          // divisionPointInfos: s.divisionPoints.map((dp) => {
          //   return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, color: dp.color };
          // }),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points
            .filter((pt) => pt.type != 'divisionPoint')
            .map((pt) => {
              return pt.color;
            }),
        });
        newShape.vertexes.forEach(
          (vx, idx) => (vx.visible = s.vertexes[idx].visible),
        );
        if (newShape.name.startsWith('Parallele'))
          newShape.name = newShape.name.slice('Parallele'.length);
        if (newShape.name.startsWith('Perpendicular'))
          newShape.name = newShape.name.slice('Perpendicular'.length);
        if (newShape.geometryObject)
          newShape.geometryObject = new GeometryObject({});
        shapesList.push(newShape);
        newShape.translate(this.translation);
      });
    }

    if (this.shapeMoved > 10) {
      const transformation = getShapeAdjustment(shapesList, shapesList[0]);

      shapesList.forEach((newShape) => {
        newShape.rotate(
          transformation.rotationAngle,
          shapesList[0].centerCoordinates,
        );
        newShape.translate(transformation.translation);
      });
    }

    if (shapesList.length > 1) {
      const userGroup = new ShapeGroup(0, 1);
      userGroup.shapesIds = shapesList.map((s) => s.id);
      GroupManager.addGroup(userGroup);
    }
  }
}
