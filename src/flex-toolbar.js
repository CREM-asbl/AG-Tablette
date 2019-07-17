import { LitElement, html } from "lit-element";

class FlexToolbar extends LitElement {
  render() {
    return html`
      <style>
        :host {
          display: flex;
          flex-wrap: wrap;
          box-sizing: border-box;
        }
      </style>
      <slot></slot>
    `
  }
}
customElements.define('flex-toolbar', FlexToolbar)