import { LitElement, html } from "lit-element";

class IconButton extends LitElement {
  static get properties() {
    return {
      src: String
    }
  }
  render() {
    return html`
      <style>
        button {
          display: inline-block;
          box-sizing: border-box;
          height: 50px;
          width: 50px;
          margin: 8px 0;
          padding: 0;
          background: white;
        }

        button:hover,
        button:focus,
        button[active] {
          font-weight: bold;
          color: white;
          background: gray;
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