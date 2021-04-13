import { LitElement, html, css } from 'lit-element';

class IconButton extends LitElement {
  static get properties() {
    return {
      name: String,
      src: String,
      type: String,
    };
  }

  firstUpdated() {
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
        display: inline-block;
        border: none;
        /* box-sizing: border-box; */
        height: 52px;
        width: 52px;
        padding: 0;
        margin: 2px;
        background: #fff0;
        outline: none;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        box-shadow: 0px 0px 3px var(--menu-shadow-color);
        border-radius: 3px;
      }

      :host([active]) button {
        background-color: var(--button-selected-background-color);
        outline: none;
      }

      img {
        height: 100%;
        width: 100%;
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
