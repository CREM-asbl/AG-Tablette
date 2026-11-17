import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { app } from '../Core/App';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { BaseShapeCreationTool } from '../Core/States/BaseShapeCreationTool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { createElem } from '../Core/Tools/general';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { createRegularHelpConfig } from './createRegular.helpConfig';
import './regular-popup';

/**
 * Outil de création de polygones réguliers - Refactorisé avec BaseShapeCreationTool
 */
export class CreateRegularTool extends BaseShapeCreationTool {
  constructor() {
    super(
      'createRegularPolygon',
      'Construire un polygone régulier',
      'Regular',
      [],
    );
  }

  async start() {
    helpConfigRegistry.register(this.name, createRegularHelpConfig);
    this.standardStart();

    // On force une seule instance visible du popup.
    const existingPopups = document.querySelectorAll('regular-popup');
    existingPopups.forEach((popup) => popup.remove());

    createElem('regular-popup');

    // Le popup s'occupera de passer à l'étape 'drawFirstPoint'
  }

  async loadShapeDefinition() {
    this.shapeDefinition = {
      numberOfPointsRequired: 2
    };
  }

  numberOfPointsRequired() {
    return 2;
  }

  /**
   * Rafraîchir l'aperçu de la forme
   */
  refreshShapePreview() {
    if (this.numberOfPointsDrawn === 2) {
      const path = this.getPath(
        this.points[0].coordinates,
        this.points[1].coordinates,
      );

      // On crée une forme temporaire pour l'aperçu
      const shape = new RegularShape({
        path: path,
        layer: 'upper',
        strokeColor: app.settings.temporaryDrawColor,
        fillOpacity: 0,
      });

      if (this.previewShapeId) {
        const index = app.upperCanvasLayer.shapes.findIndex(
          (s) => s.id === this.previewShapeId,
        );
        if (index !== -1) app.upperCanvasLayer.shapes.splice(index, 1);
      }
      this.previewShapeId = shape.id;

      shape.vertexes.forEach((vx) => {
        vx.color = app.settings.temporaryDrawColor;
        vx.size = 2;
      });
      return true; // Indiquer que l'aperçu a été géré ici
    }
    return false;
  }

  getPath(firstCoordinates, secondCoordinates) {
    const numberOfPoints = app.settings.numberOfRegularPoints || 3;
    const externalAngle = (Math.PI * 2) / numberOfPoints;

    let path = [
      'M',
      firstCoordinates.x,
      firstCoordinates.y,
      'L',
      secondCoordinates.x,
      secondCoordinates.y,
    ];

    const length = firstCoordinates.dist(secondCoordinates);

    const startAngle = Math.atan2(
      -(firstCoordinates.y - secondCoordinates.y),
      -(firstCoordinates.x - secondCoordinates.x),
    );

    let currentCoordinates = secondCoordinates;

    for (let i = 0; i < numberOfPoints - 2; i++) {
      const dx = length * Math.cos(startAngle - (i + 1) * externalAngle);
      const dy = length * Math.sin(startAngle - (i + 1) * externalAngle);

      currentCoordinates = currentCoordinates.add({ x: dx, y: dy });

      path.push('L', currentCoordinates.x, currentCoordinates.y);
    }

    path.push('L', firstCoordinates.x, firstCoordinates.y);

    path = path.join(' ');

    return path;
  }

  async executeAction() {
    const path = this.getPath(
      this.points[0].coordinates,
      this.points[1].coordinates,
    );

    const shape = new RegularShape({
      layer: 'main',
      path: path,
      name: 'RegularPolygon',
      familyName: 'Regular',
      strokeColor: '#000000',
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    const transformation = getShapeAdjustment([shape], shape);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);

    shape.vertexes[0].adjustedOn = this.points[0].adjustedOn;
    shape.vertexes[1].adjustedOn = this.points[1].adjustedOn;
    linkNewlyCreatedPoint(shape, shape.vertexes[0]);
    linkNewlyCreatedPoint(shape, shape.vertexes[1]);

    return shape;
  }
}
