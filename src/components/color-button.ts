import '@styles/button.css';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('color-button')
export class ColorButton extends LitElement {

  @property({ type: String }) innerText
  @property({ type: String }) name
  @property({ type: Boolean }) disabled
  @property({ type: Boolean, attribute: 'loading', reflect: true }) loading = false
  @state() private displayText: string = '';

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

  :host([loading]) button {
    animation: blink 1.5s infinite;
  }

  @keyframes blink {
    0% { opacity: .5 }
    50% { opacity: 1 }
    100% { opacity: .5 }
  }
  `

  constructor() {
    super();
    this.displayText = '';
  }

  updated(changedProperties) {
    if (changedProperties.has('innerText') || !this.displayText) {
      this.displayText = this.innerText;
    }
  }

  render() {
    const text = this.loading ? "Téléchargement en cours..." : this.displayText || this.innerText;
    return html`<button ?disabled="${this.disabled}"><slot>${text}</slot></button>`;
  }
}