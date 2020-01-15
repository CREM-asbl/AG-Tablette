import { app } from '../App';

/**
 * Cette classe abstraite représente un état possible de l'application
 */
export class State {
  constructor(name) {
    if (this.constructor === State) {
      throw new TypeError('Abstract class "State" cannot be instantiated directly');
    }
    this.name = name;

    this.actions = null;

    // idle for nothing, paused if stopped by permanent state, running for running...
    this.status = 'idle';

    window.addEventListener('app-state-changed', event => {
      if (this.status == 'running') {
        if (this.name == app.state) {
          this.start(event.detail.startParams);
          this.status = 'running';
        } else {
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

    window.addEventListener('drawUpper', event => {
      if (this.name == app.state) this.draw(event.detail.ctx, app.lastKnownMouseCoordinates);
    });

    window.addEventListener('shapeDrawn', event => {
      if (this.name == app.state) this.shapeDrawn(event.detail.ctx, event.detail.shape);
    });

    this.handler = event => this._actionHandle(event);
  }

  //Événements pouvant être définis. Un return false désactivera l'appel à objectSelected
  onClick(mouseCoordinates, event, isSecondCall = false) {
    return true;
  }
  onMouseDown(mouseCoordinates, event) {
    return true;
  }
  onMouseUp(mouseCoordinates, event) {
    return true;
  }
  onMouseMove(mouseCoordinates, event) {
    return true;
  }
  onTouchStart(mouseCoordinates, event) {
    return true;
  }
  onTouchMove(mouseCoordinates, event) {
    return true;
  }
  onTouchEnd(mouseCoordinates, event) {
    return true;
  }
  onTouchLeave(mouseCoordinates, event) {
    return true;
  }
  onTouchCancel(mouseCoordinates, event) {
    return true;
  }

  /**
   * Appelée par interactionAPI quand un objet (point, forme, segment)
   * est sélectionnée (onClick)
   * @param  {Object} object            L'objet sélectionné
   *                          Voir InteractionAPI.selectObject()
   * @param  {Point} mouseCoordinates  Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   * @return {Boolean}                false: désactive l'appel à onClick si
   *                                  cet appel est réalisé après.
   */
  objectSelected(object, mouseCoordinates, event) {
    return true;
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx, mouseCoordinates) {}

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

  //Appelé par state-menu lors d'un clic sur un des boutons.
  clickOnStateMenuButton(btn_value) {}
}
