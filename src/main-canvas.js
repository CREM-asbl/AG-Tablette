import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class MainCanvas extends PolymerElement {
  static get template() {
    return html`
        <style>
            :host {
                display: block;
            }

            svg {
                width: 100%;
                height: 100%;
                background-color: white;
            }
        </style>
        <svg id="svg"></svg>
`;
  }

  static get is() { return 'main-canvas' }

  // static get properties() {
  //     return {
  //         currentPosition: Object,
  //         currentShape: Object,
  //     }
  // }

  // addShape(shape) {
  //     this.$.svg.appendChild(shape)
  // }

  // ready() {
  //     super.ready()
  //     this.addEventListener('touchmove', this._handleTouch.bind(this), false)
  //     // this.addEventListener("touchstart", this._handleStart.bind(this), false);
  //     this.addEventListener("touchend", this._handleEnd.bind(this), false);
  //     // addEventListener("touchcancel", handleCancel, false);
  //     // addEventListener("touchleave", handleLeave, false);
  // }

  // _updateData(event) {

  //     this.currentPosition = event.touches ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY }

  //     if (!event.target) { return }
  //     this.currentShape = event.target.id === "svg" ? null : event.target
  // }

  // _handleClick(event) {
  //     this._updateData(event)
  //     if (!window.currentAction) { return }
  //     window.currentAction.click(this.currentPosition, this)
  // }

  // _handleMove(event) {
  //     this._updateData(event)
  //     if (!window.currentAction) { return }
  //     window.currentAction.mouseMove(this.currentPosition)
  // }

  // _handleTouch(event) {
  //     this._updateData(event)
  //     if (!window.currentAction) { return }
  //     window.currentAction.mouseMove(this.currentPosition)
  //     event.preventDefault()
  // }

  // _handleEnd() {
  //     if (!window.currentAction) { return }
  //     window.currentAction.end()
  // }
}
customElements.define(MainCanvas.is, MainCanvas)
