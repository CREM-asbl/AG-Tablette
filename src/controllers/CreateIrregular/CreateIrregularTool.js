import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { SelectManager } from '../Core/Managers/SelectManager';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { BaseShapeCreationTool } from '../Core/States/BaseShapeCreationTool';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
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
    // Fige explicitement le dernier point au relâchement (copié de BaseShapeCreationTool)
    const lastPoint = this.points[this.numberOfPointsDrawn - 1];
    const releaseCoordinates = this.getValidMouseCoordinates();
    if (lastPoint && releaseCoordinates) {
      lastPoint.coordinates = releaseCoordinates;
      this.adjustPoint(lastPoint);
      this.syncPreviewFromCurrentState();
    }

    // On vérifie si on a cliqué sur un point existant
    for (let i = 0; i < this.numberOfPointsDrawn - 1; i++) {
      if (
        SelectManager.areCoordinatesInMagnetismDistance(
          this.points[i].coordinates,
          this.points[this.numberOfPointsDrawn - 1].coordinates,
        )
      ) {
        // Le dernier point est un point temporaire ajouté au mousedown.
        // Lors d'une fermeture sur le premier point, on le retire pour éviter
        // un doublon du sommet initial dans la forme finale.
        const numberOfDistinctPoints = this.numberOfPointsDrawn - 1;
        if (i === 0 && numberOfDistinctPoints >= 3) {
          this.rollbackLastPoint();
          this.completeShape();
          return;
        } else {
          // Sinon c'est une collision invalide
          this.handleMagnetismCollision(i);
          return;
        }
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
