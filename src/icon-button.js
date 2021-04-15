import { LitElement, html, css } from 'lit-element';

class IconButton extends LitElement {
  static get properties() {
    return {
      name: String,
      src: String,
      type: String,
    };
  }

  updated() {
    //Todo: Refacto (ce code ne devrait pas se trouver ici)
    if (this.type == 'State') {
      this.src = '/images/States/' + this.name + '.svg';
    } else if (this.type == 'Geometry') {
      this.src = '/images/Geometry/' + this.name + '.svg';
    } else {
      this.src = '/images/' + this.name + '.svg';
    }
  }

  static get styles() {
    return css`
      :host([disabled]) {
        opacity: 0.5;
        pointer-events: none;
      }

      button {
        display: block;
        box-sizing: border-box;
        height: 52px;
        width: 52px;
        padding: 0px;
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
    `;
  }

  render() {
    if(!this.src) return
    return html`
      <button style="background-image:url('${this.src}')"></button>
    `;
  }
}
customElements.define('icon-button', IconButton);
