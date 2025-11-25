import '@components/color-button';
import { css, html, LitElement } from 'lit';
import { app, setState } from '../Core/App';

class OpacityPopup extends LitElement {
  constructor() {
    super();

    window.addEventListener(
      'close-popup',
      () => {
        this.submitAndClose();
      },
      {
        once: true,
      },
    );

    this.updateProperties = () => {
      this.opacity = app.settings.shapeOpacity;
    };
    this.updateProperties();

    this.eventHandler = () => {
      this.updateProperties();
    };
    window.addEventListener('settings-changed', this.eventHandler);
  }

  static get properties() {
    return {
      opacity: Number,
    };
  }

  static styles = css`
    .field {
      display: flex;
      align-items: center;
      padding: 8px 0;
      width: 100%;
    }

    select {
      height: 32px;
      width: auto;
      border-radius: 4px;
    }

    input {
      height: 24px;
      width: auto;
      border-radius: 4px;
    }

    input[type='checkbox'] {
      height: 24px;
      width: 24px;
    }

    label {
      font-weight: normal;
      margin: 0 8px;
      font-size: 1rem;
    }
  `;


  render() {
    return html`
      <template-popup>
        <h2 slot="title">Opacité</h2>
        <div slot="body" id="body">
          <div class="field">
            <label for="opacity_popup_select">Rendre une figure</label>
            <select
              name="opacity_popup_select"
              id="opacity_popup_select"
              @change="${this.changeOpacity}"
            >
              <option value="0" ?selected="${this.opacity === 0}">
                transparent
              </option>
              <option value="0.7" ?selected="${this.opacity === 0.7}">
                semi-transparent
              </option>
              <option value="1" ?selected="${this.opacity === 1}">opaque</option>
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

  changeOpacity(event) {
    const shapeOpacity = parseFloat(event.target.value);
    setState({
      settings: { ...app.settings, shapeOpacity },
    });
  }

  submit() {
    setState({
      tool: { ...app.tool, name: 'opacity', currentStep: 'selectObject' },
    });
  }

  close() {
    this.remove();
    window.removeEventListener('settings-changed', this.eventHandler);
  }

  submitAndClose() {
    this.submit();
    this.close();
  }
}
customElements.define('opacity-popup', OpacityPopup);
