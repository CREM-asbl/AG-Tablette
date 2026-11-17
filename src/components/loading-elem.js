import { css, LitElement } from 'lit';

class LoadingElem extends LitElement {
  static styles = css`
    :host {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      z-index: 100;
      background: no-repeat url('/images/spinner.gif') center center #0003;
    }
  `;
}
customElements.define('loading-elem', LoadingElem);
