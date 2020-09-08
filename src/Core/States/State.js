import { app } from '../App';

/**
 * Cette classe abstraite représente un état possible de l'application
 */
export class State {
  constructor(name, title, type) {
    if (this.constructor === State) {
      throw new TypeError(
        'Abstract class "State" cannot be instantiated directly'
      );
    }
    this.name = name;
    this.title = title;

    this.actions = null;

    // idle for nothing, paused if stopped by permanent state, running for running...
    this.status = 'idle';

    app.states.push({
      name: name,
      title: this.title,
      type: type,
    });

    window.addEventListener('app-state-changed', event => {
      if (this.status == 'running') {
        if (this.name == app.state) {
          this.restart(true, event.detail.startParams);
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

    window.addEventListener('get-help-text', () => {
      if (this.status == 'running') {
        const popup = document.querySelector('help-popup');
        popup.setText(this.getHelpText());
      }
    });

    window.addEventListener('abort-state', () => {
      if (this.status == 'running') {
        this.status = 'paused';
        this.end();
      }
    });

    window.addEventListener('drawUpper', () => {
      if (this.name == app.state) this.draw();
    });

    window.addEventListener('shapeDrawn', event => {
      if (this.name == app.state) this.shapeDrawn(event.detail.shape);
    });

    this.handler = event => this._actionHandle(event);
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    console.error('getHelpText() not implemented');
    return "Aucune aide n'est actuellement disponible pour l'élément sélectionné.";
  }

  onClick(mouseCoordinates) {
    throw new TypeError('method not implemented');
  }
  onMouseDown(mouseCoordinates) {
    throw new TypeError('method not implemented');
  }
  onMouseMove(mouseCoordinates) {
    throw new TypeError('method not implemented');
  }
  onMouseUp(mouseCoordinates) {
    throw new TypeError('method not implemented');
  }
  onTouchStart(touches) {
    throw new TypeError('method not implemented');
  }
  onTouchMove(touches) {
    throw new TypeError('method not implemented');
  }
  onTouchEnd(touches) {
    throw new TypeError('method not implemented');
  }
  onTouchCancel(touches) {
    throw new TypeError('method not implemented');
  }

  /**
   * Appelée par événement du SelectManager quand un objet (point, forme, segment)
   * @param  {Object} object            L'objet sélectionné (Shape, Segment ou Point)
   */
  objectSelected(object) {
    throw new TypeError('method not implemented');
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  draw() {}

  /**
   * Appelée par la fonction de dessin après avoir dessiné une forme sur le
   * canvas principal
   * @param  {Shape}      shape   La forme dessinée
   */
  shapeDrawn(shape) {}

  /**
   * Exécuter les actions liée à l'état.
   */
  executeAction() {
    window.dispatchEvent(new CustomEvent('actions', { detail: this.actions }));
    this.actions.forEach(action =>
      window.dispatchEvent(new CustomEvent(action.name, { detail: action }))
    );
    window.dispatchEvent(
      new CustomEvent('actions-executed', {
        detail: { name: this.title, actions: this.actions },
      })
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
    this.requestAnimFrameId = window.requestAnimationFrame(() =>
      this.animate()
    );
  }
}
