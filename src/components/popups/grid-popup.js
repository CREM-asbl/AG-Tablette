import '@components/color-button';
import { app } from '@controllers/Core/App.js';
import { gridStore } from '@store/gridStore';
import { LitElement, css, html } from 'lit';
import { templatePopupStyles } from './template-popup';

class GridPopup extends LitElement {
  static properties = {
    gridShown: Boolean,
    gridType: String,
    gridSize: Number,
  };

  static styles = [
    templatePopupStyles,
    css`
      .field {
        display: grid;
        grid-template-columns: 1fr 1fr;
        text-align: left;
      }
      label {
        margin: 0;
      }
    `,
  ];

  constructor() {
    super();
    // Initialiser les propriétés à partir du store
    const storeState = gridStore.getState();
    this.gridType = storeState.gridType;
    this.gridSize = storeState.gridSize;
    // gridShown n'est plus une propriété directe du store, mais dérivée de isVisible et gridType
    this.gridShown = storeState.isVisible && storeState.gridType !== 'none';
    this._unsubscribe = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = gridStore.subscribe((state) => {
      this.gridType = state.gridType;
      this.gridSize = state.gridSize;
      this.gridShown = state.isVisible && state.gridType !== 'none';
      // requestUpdate est implicitement appelé par LitElement lors de la modification des propriétés déclarées
    });
    // Initialiser l'état une fois connecté, au cas où il aurait changé entre le constructeur et la connexion
    const currentState = gridStore.getState();
    this.gridType = currentState.gridType;
    this.gridSize = currentState.gridSize;
    this.gridShown = currentState.isVisible && currentState.gridType !== 'none';
  }

  disconnectedCallback() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
    super.disconnectedCallback();
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Grille</h2>
        <div slot="body" id="body">
          <div class="field">
            <label for="grid_popup_grid_type">Type de grille </label>
            <select
              name="grid_popup_grid_type"
              id="grid_popup_grid_type"
              @change="${this._actionHandle}"
            >
              <option value="none" ?selected="${this.gridType === 'none'}">
                Aucune
              </option>
              <option value="square" ?selected=${this.gridType === 'square'}>
                Carrés
              </option>
              <option
                value="horizontal-triangle"
                ?selected=${this.gridType === 'horizontal-triangle'}
              >
                Triangles 1
              </option>
              <option
                value="vertical-triangle"
                ?selected=${this.gridType === 'vertical-triangle'}
              >
                Triangles 2
              </option>
            </select>
          </div>

          <br />

          <div class="field">
            <label for="grid_popup_grid_size">Taille de la grille </label>
            <select
              name="grid_popup_grid_size"
              id="grid_popup_grid_size"
              @change="${this._actionHandle}"
              ?disabled="${this.gridType === 'none'}"
            >
              <option
                value="0.333333333333333"
                ?selected="${this.gridSize === 0.333333333333333}"
              >
                1/3
              </option>
              <option value="0.5" ?selected="${this.gridSize === 0.5}">
                1/2
              </option>
              <option value="1" ?selected="${this.gridSize === 1}">1</option>
              <option value="2" ?selected="${this.gridSize === 2}">2</option>
              <option value="3" ?selected="${this.gridSize === 3}">3</option>
            </select>
          </div>
        </div>

        <div slot="footer">
          <color-button
            @click="${() =>
        window.dispatchEvent(new CustomEvent('close-popup'))}"
            innerText="Ok"
          ></color-button>
        </div>
      </template-popup>
    `;
  }

  firstUpdated() {
    window.addEventListener(
      'close-popup',
      () => {
        this.submitAndClose();
      },
      { once: true },
    );
    // window.addEventListener('settings-changed', this.updateProperties.bind(this)); // Supprimé
  }

  submit() {
    // setState({ tool: null }); // Sera géré différemment ou supprimé si plus pertinent
  }

  close() {
    this.remove();
    // window.removeEventListener('settings-changed', this.eventHandler); // Supprimé (eventHandler n'existe pas, probablement une typo pour updateProperties)
  }

  submitAndClose() {
    this.submit();
    this.close();
    if (!app.fullHistory.isRunning) {
      window.dispatchEvent(
        new CustomEvent('actions-executed', { detail: { name: 'Grille' } }),
      );
    }
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    switch (event.target.name) {
      case 'grid_popup_grid_type':
        // setState remplacé par l'action du store
        gridStore.setGridType(event.target.value);
        // La logique de gridShown est maintenant gérée par le store via setGridType
        // setState({
        //   settings: {
        //     ...app.settings,
        //     gridType: event.target.value,
        //     gridShown: event.target.value !== 'none',
        //   },
        // });
        break;

      case 'grid_popup_grid_size':
        // setState remplacé par l'action du store
        gridStore.setGridSize(parseFloat(event.target.value));
        // setState({
        //   settings: {
        //     ...app.settings,
        //     gridSize: event.target.value,
        //   },
        // });
        break;

      default:
        console.error(
          'Grid popup: paramètre inconnu: ' +
          event.target.name +
          ' ' +
          event.target.value +
          ' ' +
          event.target.checked,
        );
    }
  }
}
customElements.define('grid-popup', GridPopup);
