import { app } from '../App';
import { MergeAction } from './Actions/Merge';
import { State } from './State';

/**
 * Fusionner 2 formes en une nouvelle forme
 */
export class MergeState extends State {
  constructor() {
    super('merge_shapes');

    // listen-canvas-click -> selecting-second-shape
    this.currentStep = null;

    this.firstShape = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Fusionner";
      return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil
                permet de fusionner deux formes ayant au moins un côté commun
                en une seule forme. Une nouvelle forme (le fruit de la fusion)
                est créée, et les deux formes d'origine restent intactes.<br />

                Pour fusionner les deux formes, touchez la première forme puis
                la seconde.<br /><br />

                <b>Note:</b> pour qu'une fusion entre deux formes soit possible,
                il faut que les deux formes aient au moins un segment en commun
                (un côté entier, ou une partie d'un côté). Il ne faut pas que
                les deux formes se chevauchent pour que la fusion puisse être
                réalisée.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.actions = [new MergeAction(this.name)];
    this.currentStep = 'listen-canvas-click';

    this.firstShape = null;

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    app.appDiv.cursor = 'default';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape) {
    if (this.currentStep == 'listen-canvas-click') {
      this.currentStep = 'selecting-second-shape';
      this.actions[0].firstShapeId = shape.id;
      this.firstShape = shape;
      app.drawAPI.askRefresh();
      app.drawAPI.askRefresh('upper');
      return;
    }
    if (this.currentStep != 'selecting-second-shape') return;
    if (this.actions[0].firstShapeId == shape.id) {
      this.currentStep = 'listen-canvas-click';
      this.actions[0].firstShapeId = null;
      this.firstShape = null;
      app.drawAPI.askRefresh();
      app.drawAPI.askRefresh('upper');
      return;
    }
    this.actions[0].secondShapeId = shape.id;

    let shape1 = this.firstShape,
      shape2 = shape;

    if (shape1.getCommonsPoints(shape2).length < 2) {
      console.log('no common segments');
      return;
    }

    if (shape1.overlapsWith(shape2)) {
      console.log('shapes overlap!');
      return;
    }

    this.executeAction();
    this.start();
    app.drawAPI.askRefresh();
    app.drawAPI.askRefresh('upper');
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   */
  draw(ctx) {
    if (this.currentStep == 'selecting-second-shape') {
      let shape = this.firstShape,
        borderColor = shape.borderColor;
      shape.borderColor = '#E90CC8';
      app.drawAPI.drawShape(ctx, shape, 3);
      shape.borderColor = borderColor;
    }
  }

  /**
   * Appelée par la fonction de dessin, renvoie les formes qu'il ne faut pas
   * dessiner sur le canvas principal.
   * @return {[Shape]} les formes à ne pas dessiner
   */
  getEditingShapes() {
    if (this.currentStep != 'selecting-second-shape') return [];
    return [this.firstShape];
  }
}
