import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { createElem } from '../Core/Tools/general';
import { Shape } from '../Core/Objects/Shape';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateState extends State {
  constructor() {
    super('createShape', 'Ajouter une forme');

    // show-family-shape -> listen-canvas-click -> moving-shape
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
  start(family) {
    this.currentStep = 'show-family-shapes';
    this.selectedFamily = family;
    const templateNames = app.environment.getFamily(family).templateNames;

    if (templateNames.length === 1) {
      this.selectTemplate(templateNames[0]);
      return;
    }

    if (!this.shapesList) {
      import('./shapes-list');
      this.shapesList = createElem('shapes-list');
    }
    this.shapesList.selectedFamily = family;
    this.shapesList.templateNames = templateNames;
    this.shapesList.style.display = 'flex';
    this.shapesList.templateName = null;

    window.dispatchEvent(
      new CustomEvent('family-selected', {
        detail: { selectedFamily: this.selectedFamily },
      })
    );

    window.addEventListener('select-template', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart(manualRestart = false, family) {
    this.end();
    if (manualRestart) {
      this.start(family);
      return;
    }
    window.dispatchEvent(
      new CustomEvent('family-selected', {
        detail: { selectedFamily: this.selectedFamily },
      })
    );
    if (this.templateName) {
      this.currentStep = 'listen-canvas-click';
      window.dispatchEvent(
        new CustomEvent('select-template', {
          detail: { templateName: this.templateName },
        })
      );
    } else {
      this.currentStep = 'show-family-shapes';
    }

    window.addEventListener('select-template', this.handler);
    this.mouseDownId = app.addListener('canvasmousedown', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      if (this.shapesList) this.shapesList.remove();
      this.shapesList = null;
    }
    this.stopAnimation();
    window.removeEventListener('select-template', this.handler);
    app.removeListener('canvasmousedown', this.mouseDownId);
    app.removeListener('canvasmouseup', this.mouseUpId);
    window.dispatchEvent(
      new CustomEvent('family-selected', { detail: { selectedFamily: null } })
    );
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'select-template') {
      this.selectTemplate(event.detail.templateName);
    } else if (event.type == 'canvasmousedown') {
      this.onMouseDown();
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  selectTemplate(templateName) {
    if (templateName) {
      this.templateName = templateName;
      this.selectedTemplate = app.environment
        .getFamily(this.selectedFamily)
        .getTemplate(templateName);
      // if (this.shapesList) this.shapesList.shapeName = selectedTemplate.name;
      this.currentStep = 'listen-canvas-click';
      this.mouseDownId = app.addListener('canvasmousedown', this.handler);
    }
  }

  onMouseDown() {
    if (this.currentStep != 'listen-canvas-click') return;
    this.shapeToCreate = new Shape({
      ...this.selectedTemplate,
      drawingEnvironment: app.upperDrawingEnvironment,
    });
    let shapeSize = app.settings.get('shapesSize');

    this.shapeToCreate.size = shapeSize;
    this.shapeToCreate.scale(shapeSize);

    this.currentShapePos = Coordinates.nullCoordinates;

    if (this.shapeToCreate.isCircle()) this.shapeToCreate.isCenterShown = true;

    this.currentStep = 'moving-shape';
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
    this.animate();
  }

  onMouseUp() {
    if (this.currentStep != 'moving-shape') return;

    let shapeSize = app.settings.get('shapesSize');

    this.actions = [
      {
        name: 'CreateAction',
        selectedTemplate: this.selectedTemplate,
        coordinates: app.workspace.lastKnownMouseCoordinates,
        shapeId: this.shapeToCreate.id,
        shapeSize: shapeSize,
      },
    ];

    this.executeAction();
    this.restart();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  refreshStateUpper() {
    if (this.currentStep != 'moving-shape') {
      app.upperDrawingEnvironment.removeAllObjects();
    } else {
      this.shapeToCreate.translate(
        app.workspace.lastKnownMouseCoordinates.substract(this.currentShapePos)
      );
      this.currentShapePos = app.workspace.lastKnownMouseCoordinates;
    }
  }
}
