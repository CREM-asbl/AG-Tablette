import { app, setState } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { createElem } from '../Core/Tools/general';
import { Shape } from '../Core/Objects/Shape';
import { Coordinates } from '../Core/Objects/Coordinates';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateState extends State {
  constructor() {
    super('create', 'Ajouter une forme');

    // start -> listen -> move
    this.currentStep = null;

    this.selectedFamily = null;

    this.selectedTemplate = null;

    this.shapeToCreate = null;
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
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Après avoir sélectionné une famille de formes dans le menu, vous devez
        appuyer sur une des formes dans le menu qui apparaît en bas de l'écran.
        Appuyez ensuite sur l'écran pour ajouter une forme.<br /><br />
        <b>Note:</b> vous pouvez appuyer sur l'écran puis bouger votre doigt
        sans le relacher, pour positionner plus précisément la nouvelle forme.
      </p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
    if (!this.shapesList) {
      import('./shapes-list');
      this.shapesList = createElem('shapes-list');
    }
  }

  listen() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  move() {
    this.stopAnimation();
    this.removeListeners();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.shapesList = null;

    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  canvasMouseDown() {
    if (app.tool.currentStep != 'listen') return;

    const selectedTemplate = app.environment
      .getFamily(app.tool.selectedFamily)
      .getTemplate(app.tool.selectedTemplate);

    this.shapeToCreate = new Shape({
      ...selectedTemplate,
      drawingEnvironment: app.upperDrawingEnvironment,
    });
    let shapeSize = app.settings.get('shapesSize');

    this.shapeToCreate.size = shapeSize;
    this.shapeToCreate.scale(shapeSize);

    this.currentShapePos = Coordinates.nullCoordinates;

    if (this.shapeToCreate.isCircle()) this.shapeToCreate.isCenterShown = true;

    setState({ tool: { ...app.tool, currentStep: 'move' } });
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep != 'move') return;

    this.executeAction();
    setState({ tool: { ...app.tool, currentStep: 'listen' } });
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'move') {
      this.shapeToCreate.translate(
        app.workspace.lastKnownMouseCoordinates.substract(this.currentShapePos),
      );
      this.currentShapePos = app.workspace.lastKnownMouseCoordinates;
    }
  }

  executeAction() {
    const shapeSize = app.settings.get('shapesSize'),
      shapeCoordinates = app.workspace.lastKnownMouseCoordinates;

    const selectedTemplate = app.environment
      .getFamily(app.tool.selectedFamily)
      .getTemplate(app.tool.selectedTemplate);

    let shape = new Shape({
      ...selectedTemplate,
      size: shapeSize,
      drawingEnvironment: app.mainDrawingEnvironment,
    });
    shape.scale(shapeSize);
    shape.translate(shapeCoordinates);

    let transformation = getShapeAdjustment([shape], shape);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);
  }
}
