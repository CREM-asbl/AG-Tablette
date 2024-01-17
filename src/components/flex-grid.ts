import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';

@customElement('flex-grid')
export class FlexGrid extends LitElement {

  static styles = css`
    div {
      display: grid;
      grid-auto-flow: column;
      gap: 4px;
      list-style: none;
      overflow: auto hidden;
      padding: 4px;
      scrollbar-width: none;
    }
  `

  render() {
    return html`
      <div><slot>Aucun élément</slot></div>
    `
  }
}