import { css, html, LitElement } from 'lit';

class SaveWarning extends LitElement {
  static get properties() {
    return {
    };
  }

  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return [
      // TemplatePopup.template_popup_styles(),
      css`
        :host {
          background-color: orange;
          border-radius: 3px;
          padding: 6px;
        }
      `,
    ];
  }

  updated() {
    // window.setTimeout(
    //   () => this.shadowRoot.querySelector('#focus').focus(),
    //   200,
    // );
  }

  render() {
    return html`
      Voulez-vous partir sans enregistrer votre travail ? <br>
      Attention votre travail actuel sera perdu !
    `;
  }

  close() {
    this.remove();
  }
}
customElements.define('save-warning', SaveWarning);
