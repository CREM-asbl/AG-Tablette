import { LitElement, html, css } from 'lit';

export class TemplateToolbar extends LitElement {
  static get properties() {
    return {
      title: { type: String },
    };
  }

  /**
   * default styles for popup
   */
  static templateToolbarStyles() {
    return css`
      [slot='title'] {
        text-align: center;
        font-size: 1.2em;
        font-weight: bold;
        margin: 12px 0;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }

      [slot='body'] {
        display: flex;
        flex-wrap: wrap;
        box-sizing: border-box;
        margin: 3px;
        /* justify-content: space-evenly; */
      }
      /*
      [slot='footer'] {
        grid-area: 3 / 1 / 4 / 3;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
      } */
    `;
  }

  static get styles() {
    return css`
      #template-view {
        margin: auto;
        border-radius: 7px;
        overflow-y: hidden;
        background-color: var(--theme-color-soft);

        margin-bottom: 10px;
        box-shadow: 0px 0px 5px var(--menu-shadow-color);
        width: calc(4 * (52 + 2 + 2));
      }
    `;
  }

  render() {
    return html`
      <div id="template-view">
        <slot name="title"></slot>

        <slot name="body"></slot>

        <!-- <slot name="footer"></slot> -->
      </div>
    `;
  }
}

customElements.define('template-toolbar', TemplateToolbar);
