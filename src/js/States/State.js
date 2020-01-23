import { app } from '../App';

/**
 * Cette classe abstraite représente un état possible de l'application
 */
export class State {
  constructor(name, title, type) {
    if (this.constructor === State) {
      throw new TypeError('Abstract class "State" cannot be instantiated directly');
    }
    this.name = name;

    this.actions = null;

    // idle for nothing, paused if stopped by permanent state, running for running...
    this.status = 'idle';

    app.states = {
      ...app.states,
      [name]: {
        name: title,
        type: type,
      },
    };

    window.addEventListener('app-state-changed', event => {
      if (this.status == 'running') {
        if (this.name == app.state) {
          this.start(event.detail.startParams);
          this.status = 'running';
        } else {
          // console.log(this.name, 'ended');
          this.status = 'idle';
          this.end();
        }
      } else if (this.status == 'idle') {
        if (this.name == app.state) {
          this.start(event.detail.startParams);
          this.status = 'running';
        }
      } else {
        // paused
        if (this.name == app.state) {
          this.restart();
          this.status = 'running';
        }
      }
    });

    window.addEventListener('abort-state', () => {
      if (this.status == 'running') {
        this.status = 'paused';
        this.end();
      }
    });

    window.addEventListener('drawUpper', () => {
      if (this.name == app.state) this.draw(app.workspace.lastKnownMouseCoordinates);
    });

    window.addEventListener('shapeDrawn', event => {
      if (this.name == app.state) this.shapeDrawn(event.detail.ctx, event.detail.shape);
    });

    this.handler = event => this._actionHandle(event);
  }

  //Événements pouvant être définis. Un return false désactivera l'appel à objectSelected
  onClick(mouseCoordinates) {
    return true;
  }
  onMouseDown(mouseCoordinates) {
    return true;
  }
  onMouseMove(mouseCoordinates) {
    return true;
  }
  onMouseUp(mouseCoordinates) {
    return true;
  }
  onTouchStart(touches) {
    return true;
  }
  onTouchMove(touches) {
    return true;
  }
  onTouchEnd(touches) {
    return true;
  }
  onTouchCancel(touches) {
    return true;
  }

  /**
   * Appelée par événement du SelectManager quand un objet (point, forme, segment)
   * est sélectionnée (onClick)
   * @param  {Object} object            L'objet sélectionné (Shape, Segment ou Point)
   * @param  {Point} mouseCoordinates  Les coordonnées du click
   */
  objectSelected(object, mouseCoordinates) {
    return true;
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw(mouseCoordinates) {}

  /**
   * Appelée par la fonction de dessin après avoir dessiné une forme sur le
   * canvas principal
   * @param  {Context2D} ctx   le canvas
   * @param  {Shape} shape La forme dessinée
   */
  shapeDrawn(ctx, shape) {}

  /**
   * Exécuter les actions liée à l'état.
   */
  executeAction() {
    window.dispatchEvent(new CustomEvent('actions', { detail: this.actions }));
    this.actions.forEach(action =>
      window.dispatchEvent(new CustomEvent(action.name, { detail: action })),
    );
  }

  /**
   * initialiser l'état
   * (appelé quand l'utilisateur sélectionne le state)
   */
  start() {
    console.log('start() not implemented');
  }

  /**
   * réinitialiser l'état
   * (appelé quand focus du permanent state perdu)
   */
  restart() {
    console.log('restart() not implemented');
  }

  /**
   * met le state en idle ou pause
   * (appelé si changement de state ou si un permanent state prend le focus)
   */
  end() {
    console.log('end() not implemented');
  }

  /**
   * Gere l'animation de déplacement
   * override pour changer d'animation
   */
  animate() {
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    this.requestAnimFrameId = window.requestAnimationFrame(() => this.animate());
  }

  //Appelé par state-menu lors d'un clic sur un des boutons.
  clickOnStateMenuButton(btn_value) {}
}
