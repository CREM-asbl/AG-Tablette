import '@components/color-button';
import '@components/popups/template-popup';
import { html, LitElement } from 'lit';
import { setState } from '../Core/App';
import { openPopupFile } from '../Core/Managers/OpenFileManager';
import { createElem } from '../Core/Tools/general';

class StartPopup extends LitElement {

  render() {
    return html`
      <template-popup>
        <span slot="close"></span>
        <h2 slot="title">Bienvenue dans la partie Tangram</h2>
        <div slot="body">Que souhaitez-vous faire ?</div>
        <div slot="footer" id="button-container">
          <color-button @click="${this.reproduceSilhouette}">Reproduire une silhouette</color-button>
          <color-button @click="${this.createSilhouette}">Créer une silhouette</color-button>
        </div>
      </template-popup>
    `;
  }

  createSilhouette() {
    this.close();
    import('./SilhouetteCreatorTool')
    createElem('silhouette-creator-tool')
    setState({ tool: { name: 'createSilhouette', currentStep: 'start' } });
  }

  async reproduceSilhouette() {
    this.close();
    import('./SolutionCheckerTool')
    createElem('solution-checker-tool')
    await openPopupFile()
  }

  close() {
    this.remove();
  }
}
customElements.define('start-popup', StartPopup);
