import { LitElement, html } from 'lit-element'

class AppSettings extends LitElement {

    render() {
        return html`
        <style>
            .action-button {
                display: block;
                box-sizing: border-box;
                width: 100%;
                height: 30px;
                margin: 8px 0;
            }

            .action-button:hover,
            .action-button:focus {
                font-weight: bold;
            }

            canvas-button {
                display: inline-block;
                width: 50px;
                height: 50px;
                margin: 4px;
            }
            select {
                height: 37px;
                display: block;
                font-size: 24px;
                width: 150px;
            }
            input[type=checkbox] {
                height: 25px;
                display: block;
                width: 25px;
            }
            label {
                display: block;
                float: left;
                font-size: 24px;
                margin-right: 20px;
            }
        </style>

        <div id="app-settings-view" on-update-request='_updateHTMLForm'>

            <h2>Paramètres</h2>

            <fieldset>
                <legend>Général</legend>

                <label for="settings_adapt_shapes_position">Activer ajustement automatique: </label>
                <input type="checkbox" name="settings_adapt_shapes_position" id="settings_adapt_shapes_position" @change='${this._actionHandle}' />

                <br />

                <label for="settings_show_grid">Activer la grille: </label>
                <input type="checkbox" name="settings_show_grid" id="settings_show_grid" @change='${this._actionHandle}' />

                <br />

                <div style="margin-left:30px">
                    <label for="settings_grid_type">Type de grille: </label>
                    <select name="settings_grid_type" id="settings_grid_type" @change='${this._actionHandle}' disabled>
                        <option value="square">Carrés</option>
                        <option value="triangle">Triangles</option>
                    </select>

                    <br />

                    <label for="settings_grid_size">Taille de la grille: </label>
                    <select name="settings_grid_size" id="settings_grid_size" @change='${this._actionHandle}' disabled>
                        <option value="1/3">1/3</option>
                        <option value="1/2">1/2</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>

                <br />

            </fieldset>

            <br />

            <fieldset>
                <legend>Formes</legend>

                <label for="settings_shapes_size">Taille des formes: </label>
                <select name="settings_shapes_size" id="settings_shapes_size" @change='${this._actionHandle}'>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                </select>

                <br />

                <label for="settings_pointed_shapes">Activer formes pointées: </label>
                <input type="checkbox" name="settings_pointed_shapes" id="settings_pointed_shapes" @change='${this._actionHandle}' />

                <br />

                <label for="settings_sided_shapes">Formes bifaces: </label>
                <input type="checkbox" name="settings_sided_shapes" id="settings_sided_shapes" @change='${this._actionHandle}' />

                <br />

                <label for="settings_shapes_opacity">Opacité: </label>
                <select name="settings_shapes_opacity" id="settings_shapes_opacity" @change='${this._actionHandle}'>
                    <option value="0">transparent</option>
                    <option value="0.7">semi-transparent</option>
                    <option value="1">opaque</option>
                </select>
            </fieldset>

        </div>
        `
    }

    _updateHTMLForm() {
        var ws = window.app.workspace;
        //Général
        this.shadowRoot.getElementById('settings_adapt_shapes_position').checked = window.app.settings.get('automaticAdjustment');
        this.shadowRoot.getElementById('settings_show_grid').checked = window.app.settings.get('isGridShown');
        this.shadowRoot.getElementById('settings_grid_type').value = window.app.settings.get('gridType');

        var value = window.app.settings.get('gridSize');
        if (value == 0.5 || value == 1 || value == 2 || value == 3) {
            var transform = { "0.5": "1/2", "1": "1", "2": "2", "3": "3" };
            this.shadowRoot.getElementById('settings_grid_size').value = transform[(new Number(value)).toString()];
        } else if (value > 0.333 && value < 0.334) { //0.333333333333333
            this.shadowRoot.getElementById('settings_grid_size').value = "1/3";
        } else {
            this.shadowRoot.getElementById('settings_grid_size').value = "";
        }

        //Formes
        this.shadowRoot.getElementById('settings_shapes_size').value = parseInt(window.app.settings.get('shapesSize'));
        this.shadowRoot.getElementById('settings_pointed_shapes').checked = window.app.settings.get('areShapesPointed');
        this.shadowRoot.getElementById('settings_sided_shapes').checked = window.app.settings.get('areShapesSided');
        this.shadowRoot.getElementById('settings_shapes_opacity').value = (new Number(window.app.settings.get('shapesOpacity'))).toString();
    }

    /**
     * event handler principal
     */
    _actionHandle(event) {
        if (window.app.state.name)
            window.app.state.abort();
        window.app.state = { 'name': null };

        switch (event.target.name) {
            case 'settings_adapt_shapes_position':
                window.app.settings.update('automaticAdjustment', event.target.checked);
                break;

            case 'settings_show_grid':
                this.shadowRoot.getElementById("settings_grid_type").disabled = !event.target.checked;
                this.shadowRoot.getElementById("settings_grid_size").disabled = !event.target.checked;
                window.app.settings.update('isGridShown', event.target.checked);
                window.app.settings.update('gridType', this.shadowRoot.getElementById("settings_grid_type").value);
                var value = this.shadowRoot.getElementById("settings_grid_size").value;
                var transform = { "1/3": 0.333333333333333, "1/2": 0.5, "1": 1, "2": 2, "3": 3 };
                window.app.settings.update('gridSize', transform[value]);
                window.app.canvas.refreshBackgroundCanvas();
                break;

            case 'settings_grid_size':
                var value = this.shadowRoot.getElementById("settings_grid_size").value;
                var transform = { "1/3": 0.333333333333333, "1/2": 0.5, "1": 1, "2": 2, "3": 3 };
                window.app.settings.update('gridSize', transform[value]);
                window.app.canvas.refreshBackgroundCanvas();
                break;

            case 'settings_grid_type':
                window.app.settings.update('gridType', this.shadowRoot.getElementById("settings_grid_type").value);
                window.app.canvas.refreshBackgroundCanvas();
                break;

            case 'settings_shapes_size':
                window.app.settings.update('shapesSize', parseInt(event.target.value));
                break;

            case 'settings_pointed_shapes':
                window.app.settings.update('areShapesPointed', event.target.checked);
                break;

            case 'settings_sided_shapes':
                window.app.settings.update('areShapesSided', event.target.checked);
                break;

            case 'settings_shapes_opacity':
                window.app.settings.update('shapesOpacity', parseFloat(event.target.value));
                break;

            default:
                console.log("Settings: paramètre inconnu: " + event.target.name + ' ' + event.target.value + ' ' + event.target.checked);
        }
    }
}
customElements.define('app-settings', AppSettings)