/**
 * Classe permettant de sélectionner visuellement une couleur
 */
function ColorPicker(app) {
    this.app = app;

    this.callback = null;
}

/**
 * Lancer le colorpicker (le faire apparaître)
 * @param callback: fonction qui sera appelée lorsque l'utilisateur aura choisi la couleur.
 *                  La couleur sera transmise en paramètre à la fonction.
 */
ColorPicker.prototype.start = function(callback){
    if(!callback)
        return;
    //Fix Edge (click ne fonctionne pas directement sur le input)
    document.querySelector("#color-picker-label").click()

    this.callback = callback;
};

/**
 * Appelée lorsque l'utilisateur clique sur valider
 */
ColorPicker.prototype.__validate = function () {
    var cb = this.callback, val = document.querySelector('#color-picker').value;

    this.callback = null;
    cb(val);
};