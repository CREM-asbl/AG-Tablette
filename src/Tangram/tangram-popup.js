import { LitElement, html, css } from 'lit-element';
import { app } from '../Core/App';
import { TemplatePopup } from '../popups/template-popup';

class TangramPopup extends LitElement {
  constructor() {
    super();

    this.CremTangrams = app.CremTangrams;

    window.addEventListener('close-popup', () => this.close(), { once: true });
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un tangram</h2>

          <div slot="body" id="body">

          <div id="tangram_popup_tangrams_list">
            TODO: avoir un aperçu du tangram?
            <h2>Tangrams du CREM</h2>
            <ul id="tangram_popup_list1">
              ${this.CremTangrams.map(
                (tan, idx) =>
                  html`
                    <canvas-button
                      title="Tangram"
                      silhouetteIdx="${idx}"
                      @click="${() => {
                        app.workspace.initFromObject(tan.wsdata);
                        app.tangram.initFromObject(tan.tangramData);
                        window.dispatchEvent(new CustomEvent('refreshMain'));
                        window.dispatchEvent(new CustomEvent('refreshBackground'));
                        this.close();
                      }}"
                    >
                      <!-- tangram -->
                    </canvas-button>
                  `,
              )}
            </ul>

            <!-- <h2>Tangrams importés</h2>
            <ul id="tangram_popup_list2"></ul> -->

            <button
              @click="${() => {
                window.dispatchEvent(new CustomEvent('open-file'));
                this.close();
              }}"
            >
              Importer un tangram
            </button>
          </div>
        </div>
        </div>
      </template-popup>
    `;
  }

  close() {
    this.remove();
  }
}
customElements.define('tangram-popup', TangramPopup);
