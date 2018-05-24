import { PolymerElement, html } from '@polymer/polymer/polymer-element.js'
import { createShape, getFirstFamilyShape } from './formes-standard'

class CanvasButton extends PolymerElement {
  static get template() {
    return html`
        <style>
             :host {
                display: block;
            }

            svg {
                width: 100%;
                height: 100%;
                background: #fff;
                border: 1px solid black;
            }

            svg.active {
                border: 2px solid red;
            }
        </style>

        <svg id="svg" on-click="_clickHandle"></svg>
`;
  }

  static get is() { return 'canvas-button' }

  static get properties() {
      return {
          family: {
              type: String,
              observer: '_draw'
          },

          active: {
              type: String,
              notify: true,
              observer: '_isActive'
          }
      }
  }

  _clickHandle(event) {
      this.set('active', this.family)
  }

  _draw(family) {
      let shape = createShape(family, getFirstFamilyShape(family))
      shape.setAttribute('transform','translate(10,18) scale(.6)')
      this.$.svg.appendChild(shape)
  }

  _isActive(current) {
      if (current === this.family) { 
          this.$.svg.classList.add('active')
          return
      }
      this.$.svg.classList.remove('active')
  }
}
customElements.define(CanvasButton.is, CanvasButton)
