import { css, LitElement } from 'lit';
import { app } from './Core/App';

class LoadingElem extends LitElement {
  static get properties() {
    return {
      appLoading: { type: Boolean },
    };
  }

  constructor() {
    super();

    this.appLoading = false;
    window.addEventListener('state-changed', () => this.setState());
  }


  static get styles() {
    return css`
      :host {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: 100000;
        background: no-repeat url('/images/spinner.gif') center center #0003;
      }
    `
  }

  // render() {
  //   html`
  //   `
  // }

  setState() {
    this.appLoading = app.appLoading;
    if (!this.appLoading)
      this.remove();
  }
}
customElements.define('loading-elem', LoadingElem);
