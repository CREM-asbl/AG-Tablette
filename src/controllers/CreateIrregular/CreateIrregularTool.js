import { app } from '../Core/App';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { BaseShapeCreationTool } from '../Core/States/BaseShapeCreationTool';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { createIrregularHelpConfig } from './createIrregular.helpConfig';

/**
 * Outil de création de polygones irréguliers - Refactorisé avec BaseShapeCreationTool
 */
export class CreateIrregularTool extends BaseShapeCreationTool {
  constructor() {
    super(
      'createIrregularPolygon',
      'Construire un polygone irrégulier',
      'Irregular',
      [],
    );
  }

  async start() {
    helpConfigRegistry.register(this.name, createIrregularHelpConfig);
    // On n'utilise pas le sélecteur de forme pour les polygones irréguliers
    this.standardStart();
    this.drawFirstPoint();
  }

  async loadShapeDefinition() {
    // Pas de définition externe pour les polygones irréguliers
    this.shapeDefinition = {
        numberOfPointsRequired: Infinity // Indique que le nombre de points est variable
    };
  }

  numberOfPointsRequired() {
    return Infinity;
  }

  /**
   * Gestion spécifique du mouseUp pour les polygones irréguliers (clic sur le premier point pour fermer)
   */
  canvasMouseUp() {
    if (this.numberOfPointsDrawn > 2 && this.checkPointMagnetism()) {
        // Si on a cliqué sur un point existant et que c'est le premier point, on ferme la forme
        if (this.points[0].id === this.points[this.numberOfPointsDrawn-1].adjustedOn?.id || 
            this.points[0].coordinates.dist(this.points[this.numberOfPointsDrawn-1].coordinates) < 0.01) {
            this.completeShape();
            return;
        }
    }
    
    this.continueDrawing();
  }

  async executeAction() {
    const familyName = 'Irregular';

    let path = [
      'M',
      this.points[0].coordinates.x,
      this.points[0].coordinates.y,
    ];
    this.points.forEach((point, i) => {
      if (i !== 0) path.push('L', point.coordinates.x, point.coordinates.y);
    });
    path.push('L', this.points[0].coordinates.x, this.points[0].coordinates.y);
    path = path.join(' ');

    const shape = new RegularShape({
      layer: 'main',
      path: path,
      name: 'IrregularPolygon',
      familyName: familyName,
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    shape.vertexes.forEach((vx, idx) => {
      if (this.points[idx]) {
        vx.adjustedOn = this.points[idx].adjustedOn;
        linkNewlyCreatedPoint(shape, vx);
      }
    });

    return shape;
  }
}
