import '@polymer/polymer/polymer-legacy.js';
import { PolymerElement, html } from '@polymer/polymer'
import { stdShapes } from './formes-standard'
import { setMode } from './operations/mode'
import { constructMode } from './operations/construct'


class ShapesList extends PolymerElement {
  static get template() {
    return html`
        <style>
            :host {
                display: none;
                position: absolute;
                top: 50px;
                left: 251px;
                box-shadow: 1px 1px 2px gray;
                width: 150px;
                padding: 1px;
            }

            h2 {
                margin: 0;
                text-align: center;
                background: gray;
                color: white;
            }

            button {
                width: 100%;
                height: 30px;
            }

            button:hover,
            button:focus {
                font-weight: bold;
            }
        </style>
        <h2>Formes</h2>
        <template is="dom-repeat" items="[[shapes(family)]]">
            <button on-click="_clickHandle">[[item]]</button>
        </template>
`;
  }

  static get is() { return 'shapes-list' }

  static get properties() {
      return {
          family: String
      }
  }

  shapes(family) {
      if (!family) { 
          this.style.display = 'none'
          return 
      }
      this.style.display = 'block'
      return Object.keys(stdShapes[family].shapes)
  }

  _clickHandle(event) {
      event.target.focus()
      let shape = event.target.innerHTML
      window.currentFamily = this.family
      window.constructingShape = shape
      setMode(constructMode)
  }
}
customElements.define('shapes-list', ShapesList)
