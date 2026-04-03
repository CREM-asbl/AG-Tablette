import { SignalWatcher } from '@lit-labs/signals';
import { css, html, LitElement } from 'lit';
import { appActions, settings, viewport } from '../../store/appState';
import { app, changes } from '../Core/App';

class ZoomMenu extends SignalWatcher(LitElement) {
  static get properties() {
    return {
      zoomLevel: { type: Number },
      position: { type: Number },
    };
  }

  static styles = css`
    :host {
      display: grid;
      grid-template: auto / auto 1fr auto;
      justify-items: center;
      position: absolute;
      top: 5px;
      padding: 10px;
      font-size: 28px;
      border-radius: 5px;
      border: 2px solid gray;
      background-color: rgba(0, 0, 0, 0.15);
      width: auto;
      max-width: calc(100% - 230px);
      overflow-y: auto;
      max-height: 30%;
      left: ${app.settings.mainMenuWidth + 5}px;
    }

    div > * {
      cursor: pointer;
      text-align: center;
    }

    input,
    .info {
      grid-area: auto / span 3;
    }

    .info {
      cursor: initial;
      font-size: 0.8rem;
    }
  `;

  render() {
    changes.get();
    settings.get();
    const vp = viewport.get(); // Signal de viewport réactif
    this.zoomLevel = vp.zoom;
    this.position = this.getPositionFromZoom(this.zoomLevel);
    
    return html`
      <div>
        <span @click="${() => this.showResult(this.position - 1)}">-</span>
      </div>
      <div><span @click="${() => this.showResult(50)}">100%</span></div>
      <div>
        <span @click="${() => this.showResult(this.position + 1)}">+</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        .value="${this.position}"
        id="myRange"
        @change="${(e) => this.showResult(e.target.value)}"
        @input="${(e) => this.showResult(e.target.value, false)}"
        aria-label="Zoom"
      />
      <div class="info">Zoom: ${(this.zoomLevel * 100).toFixed(2)}%</div>
    `;
  }

  updateProperties() {
    // Désormais géré par render() via le signal viewport
  }

  // Utiliser les signaux pour les calculs de zoom
  getZoomFromPosition(position) {
    const settingsValue = settings.get();
    const minp = 0;
    const maxp = 100;
    const minv = Math.log10(settingsValue.minZoomLevel);
    const maxv = Math.log10(settingsValue.maxZoomLevel);

    const scale = (maxv - minv) / (maxp - minp);
    return Math.pow(10, minv + scale * (position - minp));
  }

  getPositionFromZoom(zoomLevel) {
    const settingsValue = settings.get();
    const minp = 0;
    const maxp = 100;
    const minv = Math.log10(settingsValue.minZoomLevel);
    const maxv = Math.log10(settingsValue.maxZoomLevel);

    const scale = (maxv - minv) / (maxp - minp);
    return (Math.log10(zoomLevel) - minv) / scale + minp;
  }

  showResult(sliderPos, applyZoom = true) {
    this.position = parseInt(sliderPos);
    const zoom = this.getZoomFromPosition(sliderPos);

    const step = applyZoom ? 'execute' : 'zoom';

    appActions.setActiveTool(app.tool?.name || 'zoom');
    appActions.setToolState({ zoomLevel: zoom });
    appActions.setCurrentStep(step);
  }
}
customElements.define('zoom-menu', ZoomMenu);
