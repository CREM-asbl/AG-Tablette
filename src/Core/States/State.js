import { app } from '../App';

/**
 * Cette classe abstraite représente un état possible de l'application
 */
export class State {
  constructor(name, title, type) {
    if (this.constructor === State) {
      throw new TypeError(
        'Abstract class "State" cannot be instantiated directly',
      );
    }
    this.name = name;
    this.title = title;
    this.type = type;

    this.actions = null;

    // idle for nothing, paused if stopped by permanent state, running for running...
    this.status = 'stopped';

    // app.states.push({
    //   name: this.name,
    //   title: this.title,
    //   type: this.type,
    // });

    window.addEventListener('app-state-changed', (event) => {
      if (this.status == 'running') {
        if (this.name == app.state) {
          this.restart(true, event.detail.startParams);
        } else {
          this.status = 'stopped';
          this.end();
        }
      } else if (this.status == 'stopped') {
        if (this.name == app.state) {
          window.setTimeout(() => this.start(event.detail.startParams), 0);
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
        setTimeout(() => popup.setText(this.getHelpText()), 100);
      }
    });

    // called by permanent state
    window.addEventListener('abort-state', () => {
      if (this.status == 'running') {
        this.status = 'paused';
        this.end();
      }
    });

    window.addEventListener('refreshStateUpper', () => {
      if (this.name == app.tool?.name) this.refreshStateUpper();
    });

    this.handler = (event) => this.eventHandler(event);

    window.addEventListener('tool-changed', this.handler);
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
  canvasMouseDown(mouseCoordinates) {
    throw new TypeError('method not implemented');
  }
  onMouseMove(mouseCoordinates) {
    throw new TypeError('method not implemented');
  }
  canvasMouseUp(mouseCoordinates) {
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
  refreshStateUpper() {}

  /**
   * Exécuter les actions liée à l'état.
   */
  executeAction() {
    this.actions.forEach((action) =>
      window.dispatchEvent(new CustomEvent(action.name, { detail: action })),
    );
    window.dispatchEvent(
      new CustomEvent('actions-executed', {
        detail: { name: this.title, actions: this.actions },
      }),
    );
  }

  /**
   * initialiser l'état
   * (appelé quand l'utilisateur sélectionne le state)
   * @param {Object} startParams        family pour Create
   */
  start(startParams = null) {
    console.error('start() not implemented');
  }

  /**
   * réinitialiser l'état
   * (appelé quand focus du permanent state perdu ou si click sur state quand déjà selectionné)
   * @param {Boolean} manualRestart     si ou resélectionne le State en cours d'utilisation
   * @param {Object} startParams        family pour Create
   */
  restart(manualRestart = false, startParams = null) {
    console.error('restart() not implemented');
  }

  /**
   * met le state en idle ou pause
   * (appelé si changement de state ou si un permanent state prend le focus)
   */
  end() {
    console.error('end() not implemented');
  }

  /**
   * Gere l'animation de déplacement
   * override pour changer d'animation
   */
  animate() {
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    this.requestAnimFrameId = window.requestAnimationFrame(() =>
      this.animate(),
    );
  }

  stopAnimation() {
    window.cancelAnimationFrame(this.requestAnimFrameId);
  }

  removeListeners() {
    app.removeListener('canvasMouseMove', this.mouseMoveId);
    app.removeListener('canvasMouseDown', this.mouseDownId);
    app.removeListener('canvasMouseUp', this.mouseUpId);
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  eventHandler(event) {
    if (event.type == 'tool-changed') {
      if (!app.tool) {
        this.end();
      } else if (app.tool.name == this.name) {
        this[app.tool.currentStep]();
      } else if (app.tool.currentStep == 'start') {
        this.end();
      }
    } else {
      if (event.type == 'objectSelected') {
        this.objectSelected(event.detail.object);
      } else {
        this[event.type]();
      }
    }
  }
}
