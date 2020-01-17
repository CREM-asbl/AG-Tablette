import { LitElement, html } from 'lit-element';
import { app } from '../js/App';
import { Tangram } from '../js/Objects/Tangram';
import { DeleteAction } from '../js/States/Actions/Delete';
import { CreateAction } from '../js/States/Actions/Create';
import { uniqId } from '../js/Tools/general';
import { Point } from '../js/Objects/Point';

class TangramPopup extends LitElement {
  constructor() {
    super();
  }

  render() {
    return html`
      <style>
        :host {
          display: none;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          position: absolute;
          top: 0px;
          left: 0px;
        }

        #tangram-popup {
          position: absolute;
          left: 35%;
          top: 35%;
          padding: 20px;
          border-radius: 10px;
          border: 2px solid gray;
          background-color: #ddd;
          width: 30%;
          overflow-y: auto;
          text-align: center;
          font-size: 20px;
        }

        #tangram-popup-close {
          position: relative;
          font-size: 60px;
          float: right;
          cursor: pointer;
          color: #555;
          box-sizing: content-box;
          width: 30px;
          height: 30px;
          overflow: hidden;
          line-height: 40%;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -o-user-select: none;
          user-select: none;
        }
        #tangram_popup_tangrams_list {
          display: none;
        }

        select {
          font-size: 20px;
        }
        #tangram_popup_tangrams_list > ul {
          list-style-type: none;
          padding-left: 0px;
          padding-top: 5px;
        }
        #tangram_popup_tangrams_list > ul > li {
          cursor: pointer;
        }
      </style>
      <div id="tangram-popup">
        <div id="tangram-popup-close" @click="${() => (this.style.display = 'none')}">&times;</div>
        <br /><br />

        <div class="field">
          <input
            type="checkbox"
            name="tangram_popup_show_tangram"
            id="tangram_popup_show_tangram"
            ?checked="${app.workspace.settings.get('isTangramShown')}"
            @change="${this._actionHandle}"
          />
          <label for="tangram_popup_show_tangram">Activer un tangram</label>
        </div>

        <br />

        <div id="tangram_popup_tangrams_list">
          TODO: ajouter du style, avoir un aperçu du tangram?
          <h2>Tangrams du CREM</h2>
          <ul id="tangram_popup_list1"></ul>

          <h2>Tangrams importés</h2>
          <ul id="tangram_popup_list2"></ul>
          <button @click="${() => this.shadowRoot.querySelector('#tangramFileSelector').click()}">
            Importer un tangram
          </button>
        </div>
        <div>
          <input
            id="tangramFileSelector"
            accept=".json"
            type="file"
            style="visibility:hidden"
            @change=${this.addTangram}
          />
        </div>
      </div>
    `;
  }

  selectTangram(type, id) {
    let tangram = app.tangramManager.getTangram(type, id);
    app.workspace.settings.set('isTangramShown', true);
    app.workspace.settings.set('shownTangram', {
      type: type,
      id: id,
    });
    window.dispatchEvent(new CustomEvent('refreshBackground'));
    this.style.display = 'none';

    let actions = app.workspace.shapes
      .map(shape => {
        let delAction = new DeleteAction('delete_shape');
        delAction.shape = shape;
        return delAction;
      })
      .concat(
        tangram.shapes.map(shape => {
          let createAction = new CreateAction('create_shape');
          createAction.shapeToAdd = shape;
          createAction.coordinates = new Point(shape);
          createAction.shapeSize = null;
          return createAction;
        }),
      );

    actions.forEach(action => action.do());
    app.workspace.history.addStep(actions);
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  addTangram(event) {
    let file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      event.path[0].value = '';
      let tangram = new Tangram(),
        json = reader.result,
        object = JSON.parse(json);
      tangram.initFromObject(object);
      tangram.id = uniqId();
      app.tangramManager.addLocalTangram(tangram);
      this.updateTangramsList();
    };
    reader.readAsText(file);
  }

  updateTangramsList() {
    let tangrams = [app.tangrams.main, app.tangrams.local],
      uls = [
        this.shadowRoot.getElementById('tangram_popup_list1'),
        this.shadowRoot.getElementById('tangram_popup_list2'),
      ];
    for (let i = 0; i < 2; i++) {
      let ul = uls[i],
        tangramList = tangrams[i],
        type = ['main', 'local'][i],
        html = '';
      tangramList.forEach(tangram => {
        html += '<li>' + tangram.name + '</li>';
      });
      ul.innerHTML = html;
      [...ul.children]
        .filter(li => li.nodeName.toLowerCase() == 'li')
        .forEach((li, i) => {
          li.onclick = () => {
            this.selectTangram(type, tangramList[i].id);
          };
        });
    }
  }

  /**
   * event handler principal
   */
  _actionHandle(event) {
    let tangram_list = this.shadowRoot.getElementById('tangram_popup_tangrams_list');
    switch (event.target.name) {
      case 'tangram_popup_show_tangram':
        if (event.target.checked) {
          tangram_list.style.display = 'block';
          this.updateTangramsList();
        } else {
          tangram_list.style.display = 'none';
          app.workspace.settings.set('isTangramShown', false);
        }

        window.dispatchEvent(new CustomEvent('refreshBackground'));
        break;

      default:
        console.log(
          'Tangram popup: paramètre inconnu: ' +
            event.target.name +
            ' ' +
            event.target.value +
            ' ' +
            event.target.checked,
        );
    }
  }
}
customElements.define('tangram-popup', TangramPopup);
