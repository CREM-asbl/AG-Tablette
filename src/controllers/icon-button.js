import { css, html, LitElement } from 'lit';
import { app, setState } from './Core/App';

class IconButton extends LitElement {
  static get properties() {
    return {
      name: String,
      src: String,
      type: String,
      cantInteract: Boolean,
      colorPickerValue: String,
    };
  }

  constructor() {
    super();
    this.colorPickerValue = app.settings.shapesDrawColor;
  }

  updated() {
    //Todo: Refacto (ce code ne devrait pas se trouver ici)
    let name = this.name.replace(/é/g, 'e').replace(/è/g, 'e');
    if (this.type == 'State') {
      this.src = '/images/States/' + name + '.svg';
    } else if (this.type == 'Geometry') {
      this.src = '/images/Geometry/' + name + '.svg';
    } else if (this.type == 'Create') {
      this.src = '/images/Create/' + name + '.svg';
    } else {
      this.src = '/images/' + name + '.svg';
    }
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
        background-color: var(--button-hover-background-color)
      }

      :host([active]) button {
        background-color: var(--button-selected-background-color);
        outline: none;
        box-shadow: inset 0px 0px 1px var(--menu-shadow-color);
      }

      :host([helpanimation]) button {
        background-color: #F3E0BF;
      }
    `

  render() {
    if (!this.src) return;
    if (this.name == 'color' && this.cantInteract != 'true') {
      return html`
        <button style="background-image:url('${this.src}');">
          <input
            style="opacity: 0;"
            id="color-picker"
            type="color"
            value="${this.colorPickerValue}"
            @input="${e => {
          if (app.tool.name == 'color') {
            setState({
              settings: {
                ...app.settings,
                shapesDrawColor: e.target.value,
              },
              tool: { ...app.tool, currentStep: 'listen' },
            });
          }
        }}"
          />
        </button>
      `
    }
    return html`
      <button style="background-image:url('${this.src}')"></button>
    `;
  }
}
customElements.define('icon-button', IconButton);
