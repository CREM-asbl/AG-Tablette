import { app, setState } from '../Core/App';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Tool } from '../Core/States/Tool';
import { createElem, findObjectById } from '../Core/Tools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';

/**
 * Monter des objets.
 */
export class ScalarMultiplicationTool extends Tool {
  constructor() {
    super('scalarMultiplication', 'Multiplier un vecteur par un scalaire', 'operation');

    this.timeoutRef = null;

    this.drawColor = '#E90CC8';
  }

  start() {
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    createElem('scalar-popup');
  }

  selectObject() {
    app.upperCanvasLayer.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  objectSelected(object) {
    if (object.name != 'Vector') {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: "La figure sélectionnée doit être un vecteur" },
        }),
      );
      return;
    }

    this.vectorId = object.id;
    new ArrowLineShape({
      layer: 'upper',
      strokeColor: this.drawColor,
      strokeWidth: 3,
      path: object.getSVGPath('no scale', true),
      id: undefined,
    });
    window.dispatchEvent(new CustomEvent('refreshUpper'));

    this.executeAnimation();
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();
  }

  executeAnimation() {
    window.clearTimeout(this.timeoutRef);
    this.timeoutRef = window.setTimeout(() => {
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'selectObject' },
      });
    }, 500);
  }

  _executeAction() {
    this.numerator = app.settings.scalarNumerator;
    this.denominator = app.settings.scalarDenominator;

    let vector = findObjectById(
      this.vectorId
    );
    let secondPointCoordinates = vector.vertexes[0].coordinates.add(
      vector.vertexes[1].coordinates
        .substract(vector.vertexes[0].coordinates)
        .multiply(this.numerator / this.denominator)
    );
    let path = [
      'M',
      vector.segments[0].vertexes[0].x,
      vector.segments[0].vertexes[0].y,
      'L',
      secondPointCoordinates.x,
      secondPointCoordinates.y,
    ];
    path = path.join(' ');

    let newShape = new ArrowLineShape({
      layer: 'main',
      path: path,
      name: vector.name,
      familyName: 'multipliedVector',
      fillColor: vector.fillColor,
      fillOpacity: vector.fillOpacity,
      strokeColor: vector.strokeColor,
      geometryObject: new GeometryObject({
        geometryMultipliedParentShapeId: vector.id,
        geometryConstructionSpec: {
          numerator: this.numerator,
          denominator: this.denominator,
        }
      }),
    });

    computeConstructionSpec(newShape);

    vector.geometryObject.geometryMultipliedChildShapeIds.push(newShape.id);
  }
}
