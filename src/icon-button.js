import { LitElement, html } from "lit-element";

class IconButton extends LitElement {
  static get properties() {
    return {
      name: String,
      src: String
    }
  }

  render() {
    return html`
      <style>
        button {
          display: inline-block;
          box-sizing: border-box;
          height: 52px;
          width: 52px;
          padding: 0;
          margin: 2px;
          background: white;
        }

        button:hover,
        button:focus,
        :host([active]) button{
          border-color: #F66;
          outline: none;
        }

        img {
          height: 100%;
          width: 100%;
          box-sizing: border-box;
        }
      </style>

      <button>
        <img src="${this.src}">
      </button>
    `
  }
}
customElements.define('icon-button', IconButton)