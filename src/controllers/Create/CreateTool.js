
import { appActions } from '../../store/appState';
import { getFamily } from '../../store/kit';
import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { CubeShape } from '../Core/Objects/Shapes/CubeShape';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateTool extends Tool {
  constructor() {
    super('create', 'Ajouter une figure');

    // start -> listen -> move
    this.currentStep = null;

    this._selectedFamily = null;
    this._selectedTemplate = null;

    this.shapeToCreate = null;
  }

  get selectedFamily() { return this._selectedFamily; }
  set selectedFamily(value) {
    this._selectedFamily = value;
    window.dispatchEvent(new CustomEvent('create:family-changed', { detail: { family: value } }));
  }

  get selectedTemplate() { return this._selectedTemplate; }
  set selectedTemplate(value) {
    this._selectedTemplate = value;
    window.dispatchEvent(new CustomEvent('create:template-changed', { detail: { template: value } }));
  }

  updateToolStep(step, extraState = {}) {
    appActions.setActiveTool(this.name);
    appActions.setToolState({});
    if (Object.keys(extraState).length > 0) {
      appActions.setToolState(extraState);
    }
    appActions.setCurrentStep(step);
  }

  getActiveSelectedTemplate() {
    return this.selectedTemplate || app.tool?.selectedTemplate || null;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    // S'assurer que l'outil précédent soit complètement arrêté
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    // Laisser le temps à l'ancien outil de se terminer proprement
    setTimeout(() => {
      this.openShapeList();
    }, 100);
  }

  listen() {
    const selectedTemplate = app.tool?.selectedTemplate;
    if (selectedTemplate && this.selectedTemplate !== selectedTemplate) {
      this._selectedTemplate = selectedTemplate;
    }

    const selectedFamily = app.tool?.selectedFamily;
    if (selectedFamily && this.selectedFamily !== selectedFamily) {
      this._selectedFamily = selectedFamily;
    }

    // Vérifier que l'outil actif est bien 'create'
    if (app.tool.name !== 'create') {
      console.warn(
        "CreateTool.listen() appelé mais l'outil actif n'est pas create:",
        app.tool.name,
      );
      return;
    }

    // Nettoyer agressivement les contours de groupes
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);

    // S'assurer qu'on nettoie à nouveau après un petit délai au cas où quelque chose redessinerait
    setTimeout(() => {
      if (app.tool.name === 'create') {
        app.upperCanvasLayer.removeAllObjects();
      }
    }, 100);
  }

  move() {
    // S'assurer que les contours de groupes sont supprimés pendant le déplacement
    this.removeListeners();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.shapesList = null;
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
    this.selectedFamily = null;
    this.selectedTemplate = null;
  }

  openShapeList() {
    // Nettoyer les contours de groupes résiduels
    app.upperCanvasLayer.removeAllObjects();

    // Force reset de l'état de l'outil pour s'assurer qu'aucun ancien outil n'est actif
    if (app.tool.name !== 'create') {
      this.updateToolStep('start');
      return;
    }

    const family = app.tool.selectedFamily || this.selectedFamily;
    if (!family) {
      this.updateToolStep('start');
      return;
    }

    if (this.selectedFamily !== family) {
      this.selectedTemplate = null;
      appActions.setSelectedTemplate(null);
    }

    this.selectedFamily = family;
    const shapeTemplates = getFamily(family).shapeTemplates;
    if (shapeTemplates.length === 1) {
      this.selectedTemplate = shapeTemplates[0];
      appActions.setSelectedTemplate(this.selectedTemplate);
      this.updateToolStep('listen', { selectedTemplate: this.selectedTemplate });
    } else if (!this.shapesList) {
      import('../../components/shape-selector');
      appActions.setToolUiState({
        name: 'shape-selector',
        family: family,
        templatesNames: getFamily(family).shapeTemplates,
        selectedTemplate: this.selectedTemplate,
        type: 'Create',
        nextStep: 'listen',
      });
    }
  }
  canvasMouseDown() {
    const selectedTemplate = this.getActiveSelectedTemplate();
    if (app.tool.currentStep !== 'listen') return;
    if (!selectedTemplate) {
      console.warn('No template selected');
      return;
    }

    // Nettoyer avant de commencer la création
    app.upperCanvasLayer.removeAllObjects();

    if (selectedTemplate.name && selectedTemplate.name.startsWith('Segment')) {
      this.shapeToCreate = new LineShape({
        ...selectedTemplate,
        layer: 'upper',
      });
    } else {
      this.shapeToCreate = new RegularShape({
        ...selectedTemplate,
        layer: 'upper',
      });
    }
    const shapeSize = app.settings.shapesSize;

    this.shapeToCreate.size = shapeSize;
    this.shapeToCreate.scale(shapeSize);

    this.currentShapePos = Coordinates.nullCoordinates;

    if (this.shapeToCreate.isCircle()) this.shapeToCreate.isCenterShown = true;

    this.updateToolStep('move');
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep !== 'move') return;

    this.executeAction();
    // Nettoyer l'upperCanvasLayer après la création pour éviter les contours de groupe résiduels
    app.upperCanvasLayer.removeAllObjects();
    this.updateToolStep('listen');
  }

  refreshStateUpper() {
    // Nettoyer en permanence les contours de groupes résiduels quand on utilise l'outil Create
    if (app.tool.currentStep !== 'move') {
      app.upperCanvasLayer.removeAllObjects();
    }

    if (app.tool.currentStep === 'move') {
      this.shapeToCreate.translate(
        app.workspace.lastKnownMouseCoordinates.substract(this.currentShapePos),
      );
      this.currentShapePos = app.workspace.lastKnownMouseCoordinates;
    }
  }

  // Override objectSelected pour empêcher les actions de l'ancien outil Group
  objectSelected(shape) {
    // Ne rien faire - empêche les actions du GroupTool qui pourrait encore être actif
    return;
  }

  _executeAction() {
    const selectedTemplate = this.getActiveSelectedTemplate();
    if (!selectedTemplate) {
      console.warn('No template selected');
      return;
    }

    if (!selectedTemplate.name) {
      console.warn('Selected template has no name');
      return;
    }

    const shapeSize = app.settings.shapesSize,
      shapeCoordinates = app.workspace.lastKnownMouseCoordinates;

    let shape;
    if (selectedTemplate.name.startsWith('Segment')) {
      shape = new LineShape({
        ...selectedTemplate,
        size: shapeSize,
        layer: 'main',
      });
    } else if (app.environment.name !== 'Cubes') {
      shape = new RegularShape({
        ...selectedTemplate,
        size: shapeSize,
        layer: 'main',
      });
    } else {
      shape = new CubeShape({
        ...selectedTemplate,
        size: shapeSize,
        layer: 'main',
      });
    }
    shape.scale(shapeSize);
    shape.translate(shapeCoordinates);

    const transformation = getShapeAdjustment([shape], shape);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);
  }
}
