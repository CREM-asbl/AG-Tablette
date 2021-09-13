import { LitElement, html, css } from 'lit';

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
      console.log(this.src);
    } else {
      this.src = '/images/' + this.name + '.svg';
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
        margin: 2px;
      }

      :host([disabled]) {
        opacity: 0.5;
        pointer-events: none;
      }

      button {
        cursor: pointer;
        display: block;
        border: none;
        /* box-sizing: border-box; */
        height: 100%;
        width: 100%;
        padding: 0px;
        /* margin: 2px; */
        background: white;
        outline: none;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        box-shadow: 0px 0px 3px var(--menu-shadow-color);
        border-radius: 3px;
      }

      :host :hover {
        background-color: var(--button-hover-background-color)
      }

      :host([active]) button {
        background-color: var(--button-selected-background-color);
        outline: none;
        box-shadow: inset 0px 0px 1px var(--menu-shadow-color);
      }

      img {
        height: 100%;
        width: 100%;
      }
    `;
  }

  render() {
    if (!this.src) return;
    return html`
      <button style="background-image:url('${this.src}')"></button>
    `;
  }
}
customElements.define('icon-button', IconButton);
