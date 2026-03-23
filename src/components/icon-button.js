import { css, html, LitElement } from 'lit';
import { app } from '../controllers/Core/App';
import { appActions } from '../store/appState';

class IconButton extends LitElement {
  static properties = {
    name: String,
    src: String,
    type: String,
    cantInteract: Boolean,
    colorPickerValue: String,
  };

  constructor() {
    super();
    this.colorPickerValue = app.settings.shapesDrawColor;
  }

  static styles = css`
    :host {
      display: block;
      width: 50px;
      height: 50px;
    }

    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    button {
      cursor: pointer;
      display: block;
      border: none;
      height: 100%;
      width: 100%;
      padding: 0px;
      background: white;
      outline: none;
      background-repeat: no-repeat;
      background-size: 100% 100%;
      box-shadow: 0px 0px 3px var(--menu-shadow-color);
      border-radius: 4px;
    }

    input[type='color'] {
      cursor: pointer;
      height: 100%;
      width: 100%;
    }

    :host :hover {
      background-color: var(--button-hover-background-color);
    }

    :host([active]) button {
      background-color: var(--button-selected-background-color);
      outline: none;
      box-shadow: inset 0px 0px 1px var(--menu-shadow-color);
    }

  `;

  render() {
    const name = this.name.replace(/é/g, 'e').replace(/è/g, 'e');
    const src = this.type
      ? `/images/${this.type}/${name}.svg`
      : `/images/${name}.svg`;
    if (this.name === 'color') {
      return html`
        <button style="background-image:url('${src}');">
          <input
            style="opacity: 0;"
            id="color-picker"
            type="color"
            value="${this.colorPickerValue}"
            @input="${(e) => {
          if (app.tool.name === 'color') {
            app.settings.shapesDrawColor = e.target.value;
            appActions.updateSettings({ shapesDrawColor: e.target.value });
            appActions.setCurrentStep('listen');
          }
        }}"
          />
        </button>
      `;
    }
    return html` <button style="background-image:url('${src}')"></button> `;
  }
}
customElements.define('icon-button', IconButton);
