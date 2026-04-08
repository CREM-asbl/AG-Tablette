
import {
  appActions,
  currentStep,
  settings,
} from '../../../store/appState';
import { app } from '../../Core/App';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Coordinates } from '../../Core/Objects/Coordinates';
import { Point } from '../../Core/Objects/Point';
import { Segment } from '../../Core/Objects/Segment';
import { RegularShape } from '../../Core/Objects/Shapes/RegularShape';
import { BaseGeometryTool } from '../../Core/States/BaseGeometryTool';

/**
 * Classe de base pour tous les outils de création de formes géométriques
 * Factorise le code commun entre CreateTriangle, CreateQuadrilateral, CreateCircle, etc.
 */
export class BaseShapeCreationTool extends BaseGeometryTool {
  constructor(name, title, familyName, templatesImport) {
    super(name, title, 'geometryCreator');

    this.familyName = familyName;
    this.templatesImport = templatesImport;
    this.previewShapeId = null;
  }



  /**
   * Démarrage standardisé avec sélecteur de forme
   */
  async start() {
    if (!this.validateInput('start')) return;

    this.standardStart();

    try {
      // Charger dynamiquement le composant shape-selector
      await import('@components/shape-selector');

      const availableTemplates = Array.isArray(this.templatesImport)
        ? this.templatesImport
        : [];
      const initialTemplate = availableTemplates.find(
        (template) => template.name === app.tool?.selectedTemplate?.name,
      ) || null;

      if (initialTemplate) {
        appActions.setSelectedTemplate(initialTemplate);
      }

      // Utiliser le signal pour afficher le sélecteur de forme
      const uiState = {
        name: 'shape-selector',
        family: this.familyName,
        templatesNames: availableTemplates,
        selectedTemplate: initialTemplate,
        type: 'Geometry',
        nextStep: 'drawFirstPoint',
      };
      appActions.setToolUiState(uiState);
    } catch (error) {
      console.error('Erreur lors du chargement du sélecteur de forme:', error);
      this.showErrorNotification('Erreur lors du chargement des templates');
    }
  }

  /**
   * Initialisation du premier point (commune à tous les outils)
   */
  async drawFirstPoint() {
    if (!this.validateInput('drawFirstPoint')) return;

    app.upperCanvasLayer.removeAllObjects();

    try {
      // Charger la définition de la forme sélectionnée
      await this.loadShapeDefinition();

      this.resetDrawingState();
      appActions.setCurrentStep('drawPoint');
      appActions.setToolState({ numberOfPointsDrawn: this.numberOfPointsDrawn });
    } catch (error) {
      console.error('Erreur lors du chargement de la définition:', error);
      this.showErrorNotification("Erreur lors de l'initialisation");
    }
  }

  /**
   * Méthode abstraite pour charger la définition de forme spécifique
   * À surcharger dans les classes filles
   */
  async loadShapeDefinition() {
    throw new Error(
      'loadShapeDefinition doit être implémentée dans la classe fille',
    );
  }

  /**
   * Réinitialisation de l'état de dessin
   */
  resetDrawingState() {
    this.clearPreviewShape();
    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;
  }

  /**
   * Gestion standardisée du drawing point
   */
  drawPoint() {
    if (!this.validateInput('drawPoint')) return;

    this.removeListeners();
    this.stopAnimation();

    this.getConstraints(this.numberOfPointsDrawn);
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  /**
   * Animation standardisée du point
   */
  animatePoint() {
    this.removeListeners();
    this.animate();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * Gestion standardisée du mouseDown
   */
  canvasMouseDown() {
    const newCoordinates = this.getValidMouseCoordinates();
    if (!newCoordinates) return;

    // Vérifier les contraintes si applicables
    if (this.constraints && this.constraints.type === 'isConstrained') {
      if (!this.constraints.projectionOnConstraints(newCoordinates, true)) {
        appActions.addNotification({
          message: 'Veuillez placer le point sur la contrainte.',
          type: 'info',
        });
        return;
      }
    }

    this.addPointToShape(newCoordinates);
    this.syncPreviewFromCurrentState();
    appActions.setCurrentStep('animatePoint');
    appActions.setToolState({ numberOfPointsDrawn: this.numberOfPointsDrawn });
  }

  clearPreviewShape() {
    if (this.previewShapeId) {
      // Suppression non récursive pour garder les points et segments dans le calque
      const index = app.upperCanvasLayer.shapes.findIndex(
        (s) => s.id === this.previewShapeId,
      );
      if (index !== -1) app.upperCanvasLayer.shapes.splice(index, 1);
      this.previewShapeId = null;
    }
  }

  ensureClosedPreviewSegment() {
    if (this.points.length < 3) return;

    // Un contour fermé comporte autant de segments que de points.
    if (this.segments.length < this.points.length) {
      const closingSegment = new Segment({
        layer: 'upper',
        vertexIds: [this.points[this.points.length - 1].id, this.points[0].id],
      });
      this.segments.push(closingSegment);
    }
  }

  renderPreviewShape() {
    if (this.points.length < 2 || this.segments.length < 1) return;

    this.clearPreviewShape();

    const shape = new RegularShape({
      layer: 'upper',
      segmentIds: this.segments.map((seg) => seg.id),
      pointIds: this.points.map((pt) => pt.id),
      strokeColor: settings.get().temporaryDrawColor,
      fillOpacity: 0,
    });

    this.segments.forEach((seg, idx) => {
      seg.idx = idx;
      seg.shapeId = shape.id;
    });

    this.previewShapeId = shape.id;
  }

  syncPreviewFromCurrentState() {
    const handled = this.refreshShapePreview();

    if (!handled) {
      if (this.numberOfPointsDrawn === this.numberOfPointsRequired()) {
        this.ensureClosedPreviewSegment();
      }

      this.renderPreviewShape();
    }
  }

  /**
   * Ajouter un point à la forme en cours de création
   */
  addPointToShape(coordinates) {
    const point = new Point({
      layer: 'upper',
      coordinates: coordinates,
      color: settings.get().temporaryDrawColor,
      size: 2,
    });

    this.points[this.numberOfPointsDrawn] = point;
    this.numberOfPointsDrawn++;

    // Ajouter un segment si ce n'est pas le premier point
    if (this.numberOfPointsDrawn > 1) {
      const segment = new Segment({
        layer: 'upper',
        vertexIds: [
          this.points[this.numberOfPointsDrawn - 2].id,
          this.points[this.numberOfPointsDrawn - 1].id,
        ],
      });
      this.segments.push(segment);
    }
  }

  /**
   * Mise à jour de l'aperçu de la forme
   * À surcharger dans les classes filles si nécessaire
   */
  updateShapePreview() {
    // Implémentation par défaut - peut être surchargée
  }

  /**
   * Gestion standardisée du mouseUp
   */
  canvasMouseUp() {
    // Fige explicitement le dernier point au relâchement pour éviter
    // les décalages dus à la dernière frame d'animation.
    const lastPoint = this.points[this.numberOfPointsDrawn - 1];
    const releaseCoordinates = this.getValidMouseCoordinates();
    if (lastPoint && releaseCoordinates) {
      lastPoint.coordinates = releaseCoordinates;
      this.adjustPoint(lastPoint);
      this.syncPreviewFromCurrentState();
    }

    // Vérifier les points trop proches (magnétisme)
    if (this.checkPointMagnetism()) return;

    if (this.numberOfPointsDrawn === this.numberOfPointsRequired()) {
      this.completeShape();
    } else {
      this.continueDrawing();
    }
  }

  /**
   * Vérifier si le dernier point est trop proche d'un point existant
   */
  checkPointMagnetism() {
    for (let i = 0; i < this.numberOfPointsDrawn - 1; i++) {
      if (
        SelectManager.areCoordinatesInMagnetismDistance(
          this.points[i].coordinates,
          this.points[this.numberOfPointsDrawn - 1].coordinates,
        )
      ) {
        this.handleMagnetismCollision(i);
        return true;
      }
    }
    return false;
  }

  /**
   * Gérer la collision par magnétisme
   */
  handleMagnetismCollision(collisionIndex) {
    appActions.addNotification({
      message: 'Veuillez placer le point autre part.',
      type: 'info',
    });
    this.rollbackLastPoint();
    appActions.setCurrentStep('drawPoint');
    appActions.setToolState({ numberOfPointsDrawn: this.numberOfPointsDrawn });
  }

  /**
   * Annuler le dernier point ajouté
   */
  rollbackLastPoint() {
    if (this.numberOfPointsDrawn > 0) {
      this.numberOfPointsDrawn--;
      this.points.pop();
      if (this.segments.length > 0) {
        this.segments.pop();
      }
      this.syncPreviewFromCurrentState();
    }
  }

  /**
   * Continuer le dessin après un point
   */
  continueDrawing() {
    this.getConstraints(this.numberOfPointsDrawn);
    appActions.setCurrentStep('drawPoint');
    appActions.setToolState({ numberOfPointsDrawn: this.numberOfPointsDrawn });
  }

  /**
   * Terminer la forme
   */
  completeShape() {
    this.stopAnimation();

    this.safeExecuteAction(async () => {
      await this.executeAction();
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(
        new CustomEvent('actions-executed', { detail: { name: this.title } }),
      );
      this.clearPreviewShape();
      appActions.setCurrentStep('drawFirstPoint');
      appActions.setToolState({ numberOfPointsDrawn: 0 });
    }, 'création de forme');
  }

  /**
   * Ajustement standardisé des points
   */
  adjustPoint(point) {
    if (!this.validateInput('adjustPoint', { point })) return;

    point.adjustedOn = undefined;

    if (this.constraints && this.constraints.isFree) {
      this.adjustPointFree(point);
    } else if (this.constraints) {
      this.adjustPointConstrained(point);
    }
  }

  /**
   * Ajustement libre (magnétisme avec grille/points/segments)
   */
  adjustPointFree(point) {
    // Tentative d'ajustement sur un point existant
    let constraints = SelectManager.getEmptySelectionConstraints().points;
    constraints.canSelect = true;

    const adjustedPoint = SelectManager.selectPoint(
      point.coordinates,
      constraints,
      false,
    );
    if (adjustedPoint) {
      point.coordinates = new Coordinates(adjustedPoint.coordinates);
      point.adjustedOn = adjustedPoint;
      return;
    }

    // Tentative d'ajustement sur la grille
    if (app.gridCanvasLayer) {
      const gridPoint = app.gridCanvasLayer.getClosestGridPoint(
        point.coordinates.toCanvasCoordinates(),
      );
      if (gridPoint) {
        const gridPointInWorldSpace = gridPoint.fromCanvasCoordinates();
        point.coordinates = new Coordinates(gridPointInWorldSpace);
        point.adjustedOn = gridPointInWorldSpace;
        return;
      }
    }

    // Tentative d'ajustement sur un segment
    constraints = SelectManager.getEmptySelectionConstraints().segments;
    constraints.canSelect = true;

    const adjustedSegment = SelectManager.selectSegment(
      point.coordinates,
      constraints,
    );
    if (adjustedSegment) {
      point.coordinates = adjustedSegment.projectionOnSegment(
        point.coordinates,
      );
      point.adjustedOn = adjustedSegment;
    }
  }

  /**
   * Ajustement contraint
   */
  adjustPointConstrained(point) {
    let adjustedCoordinates = this.constraints.projectionOnConstraints(
      point.coordinates,
    );

    // Chercher des intersections avec d'autres segments
    const constraints = SelectManager.getEmptySelectionConstraints().segments;
    constraints.canSelect = true;
    constraints.numberOfObjects = 'allInDistance';

    const adjustedSegments = SelectManager.selectSegment(
      adjustedCoordinates,
      constraints,
    );

    if (adjustedSegments && this.constraints.segments) {
      const adjustedSegment = adjustedSegments
        .filter((seg) => !seg.isParalleleWith(this.constraints.segments[0]))
        .sort((seg1, seg2) => {
          const dist1 = seg1
            .projectionOnSegment(adjustedCoordinates)
            .dist(adjustedCoordinates);
          const dist2 = seg2
            .projectionOnSegment(adjustedCoordinates)
            .dist(adjustedCoordinates);
          return dist1 - dist2;
        })[0];

      if (adjustedSegment) {
        const intersections = adjustedSegment.intersectionWith(
          this.constraints.segments[0],
        );
        if (intersections && intersections.length > 0) {
          adjustedCoordinates = intersections.sort(
            (i1, i2) =>
              i1.dist(adjustedCoordinates) - i2.dist(adjustedCoordinates),
          )[0];
          point.adjustedOn = adjustedSegment;
        }
      }
    }

    point.coordinates = new Coordinates(adjustedCoordinates);
  }

  /**
   * Rafraîchissement de l'état supérieur
   */
  refreshStateUpper() {
    if (
      currentStep.get() === 'animatePoint' &&
      this.numberOfPointsDrawn > 0
    ) {
      const lastPoint = this.points[this.numberOfPointsDrawn - 1];
      const newCoordinates = this.getValidMouseCoordinates();

      if (newCoordinates && lastPoint) {
        lastPoint.coordinates = newCoordinates;
        this.adjustPoint(lastPoint);
        this.syncPreviewFromCurrentState();
      }
    }
  }

  /**
   * Rafraîchir l'aperçu de la forme - à surcharger si nécessaire
   */
  refreshShapePreview() {
    // Implémentation par défaut vide
    return false;
  }

  /**
   * Obtenir les contraintes pour un point donné
   * À implémenter dans les classes filles
   */
  getConstraints(pointNumber) {
    // Implémentation par défaut - pas de contraintes
    this.constraints = { isFree: true };
  }

  /**
   * Nombre de points requis pour la forme
   * À implémenter dans les classes filles
   */
  numberOfPointsRequired() {
    throw new Error(
      'numberOfPointsRequired doit être implementée dans la classe fille',
    );
  }

  /**
   * Exécution de l'action finale
   * À implémenter dans les classes filles
   */
  async executeAction() {
    throw new Error('executeAction doit être implémentée dans la classe fille');
  }
}

