import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';

@customElement('flex-grid')
export class FlexGrid extends LitElement {

  static styles = css`
    :host {
      display: grid;
      grid-auto-flow: column;
      gap: 4px;
      list-style: none;
      overflow: auto hidden;
      padding: 4px;
    }
  `

  render() {
    return html`
      <slot>Aucun élément</slot>
    `
  }
}