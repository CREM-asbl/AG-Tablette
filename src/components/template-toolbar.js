import { css, html, LitElement } from 'lit';

export class TemplateToolbar extends LitElement {
  /**
   * default styles for popup
   */
  static templateToolbarStyles() {
    return css`
      [slot='title'] {
        text-align: center;
        font-size: 1.2em;
        margin: 6px 0;
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
      }

    `;
  }

  static styles = css`
      #template-view {
        margin: auto;
        border-radius: 4px;
        overflow-y: hidden;
        background-color: var(--theme-color-soft);
        margin-bottom: 10px;
        box-shadow: 0px 0px 5px var(--menu-shadow-color);
        width: calc(4 * (52 + 2 + 2));
      }
    `

  render() {
    return html`
      <div id="template-view">
        <slot name="title"></slot>
        <slot name="body"></slot>
      </div>
    `;
  }
}

customElements.define('template-toolbar', TemplateToolbar);
