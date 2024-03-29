import '@styles/button.css';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('color-button')
export class ColorButton extends LitElement {

  @property({ type: String }) innerText
  @property({ type: String }) name
  @property({ type: Boolean }) disabled

  static styles = css`
    button {
    display: block;
    width: 100%;
    padding: 8px 16px;
    background-color: var(--theme-color);
    color: var(--text-color);
    border: none;
    box-shadow: 0px 0px 3px var(--menu-shadow-color);
    border-radius: 4px;
    cursor: pointer;
    box-sizing: border-box;
  }

  button:hover {
    opacity: 0.8;
    box-shadow: 0px 0px 5px var(--menu-shadow-color);
  }
  `

  render() {
    return html`<button ?disabled="${this.disabled}"><slot>${this.innerText}</slot></button>`;
  }
}