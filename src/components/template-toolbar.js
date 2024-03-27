import { css, html, LitElement } from 'lit';

export class TemplateToolbar extends LitElement {

  static templateToolbarStyles() {
    return css`
      [slot='title'] {
        text-align: center;
        font-size: 1.2em;
        margin: 8px 0;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      [slot='body'] {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        place-content: center;
        gap: 4px;
        box-sizing: border-box;
        padding: 4px;
      }`
  }

  static styles = css`
    :host {
        display: block;
        padding-top: 1px;
        border-radius: 4px;
        background-color: var(--theme-color-soft);
        box-sizing: border-box;
    }

    /* ::slotted([slot="title"]) {
        text-align: center;
        font-size: 1.2em;
        margin: 6px 0;
        text-overflow: ellipsis;
        overflow: hidden;
        color: red;
    }

    ::slotted([slot=body]) {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        place-content: center;
        gap: 4px;
        box-sizing: border-box;
        padding: 4px;
    } */
    `

  render() {
    return html`
      <slot name="title"></slot>
      <slot name="body"></slot>
    `;
  }
}

customElements.define('template-toolbar', TemplateToolbar);
