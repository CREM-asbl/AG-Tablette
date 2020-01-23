import { LitElement, html } from 'lit-element';

class IconButton extends LitElement {
  static get properties() {
    return {
      name: String,
      src: String,
    };
  }

  render() {
    return html`
      <style>
        :host([disabled]) {
          opacity: 0.5;
        }

        button {
          display: inline-block;
          box-sizing: border-box;
          height: 52px;
          width: 52px;
          padding: 0;
          margin: 2px;
          background: white;
          outline: none;
          background-repeat: no-repeat;
          background-size: 100% 100%;
        }

        :host([active]) button {
          border-color: var(--button-border-color);
          background-color: var(--button-background-color);
          outline: none;
        }

        img {
          height: 100%;
          width: 100%;
          box-sizing: border-box;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -o-user-select: none;
          user-select: none;
        }
      </style>

      <button style="background-image:url('${this.src}')"></button>
    `;
  }
}
customElements.define('icon-button', IconButton);
