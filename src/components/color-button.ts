import '@styles/button.css';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('color-button')
export class ColorButton extends LitElement {

  @property({ type: String }) innerText

  static styles = css`
    button {
    display: block;
    padding: 8px 16px;
    margin: 0 4px;
    background-color: var(--theme-color);
    color: var(--text-color);
    border: none;
    box-shadow: 0px 0px 3px var(--menu-shadow-color);
    border-radius: 3px;
    cursor: pointer;
  }

  button:hover {
    opacity: 0.8;
    box-shadow: 0px 0px 5px var(--menu-shadow-color);
  }
  `

  render() {
    return html`<button>${this.innerText}</button>`;
  }
}