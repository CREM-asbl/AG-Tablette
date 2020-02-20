import { LitElement, html, css } from 'lit-element';

class FlexToolbar extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-wrap: wrap;
        box-sizing: border-box;
      }
    `;
  }

  render() {
    return html`
      <slot></slot>
    `;
  }
}
customElements.define('flex-toolbar', FlexToolbar);
