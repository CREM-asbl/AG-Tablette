/**
 * Classe permettant de sélectionner visuellement une couleur
 */
function ColorPicker(app) {
    this.app = app;

    this.picker = new CP(document.querySelector('input#color-picker-input'), false);
	this.picker.on("change", function(color) {
        this.target.value = '#' + color;
    });
    this.callback = null;
}

/**
 * Lancer le colorpicker (le faire apparaître)
 * @param callback: fonction qui sera appelée lorsque l'utilisateur aura choisi la couleur.
 *                  Celle-ci sera transmise en paramètre à la fonction.
 */
ColorPicker.prototype.start = function(callback){
    if(!callback)
        return;

    var oldColors = this.app.workspace.previousSelectedColors;

    var html = "";
    for(var i=0;i<oldColors.length&&i<16;i++) { //i ne devrait pas valoir 16 ou plus
        html += '<div class="color-picker-previous-color" style="background-color: ';
        html += oldColors[i]+'" onclick="';
        html += "window.app.colorpicker.setColor('"+oldColors[i]+"')\"></div>";
    }
    document.querySelector("#color-picker-previous-colors").innerHTML = html;

    document.querySelector("#color-picker-popup").style.display = "block";

    this.picker.enter();
    this.callback = callback;
};

/**
 * Définir la couleur de l'outil visuel.
 */
ColorPicker.prototype.setColor = function(color) {
    this.picker.target.value = color;
}

/**
 * Appelée lorsque l'utilisateur clique sur valider
 */
ColorPicker.prototype.__validate = function () {
    var cb = this.callback, val = this.picker.target.value;

    if(this.app.workspace.previousSelectedColors.length>=16)
        this.app.workspace.previousSelectedColors.pop();
    this.app.workspace.previousSelectedColors.unshift(val);

    this.callback = null;
    this.picker.exit();
    document.querySelector("#color-picker-popup").style.display = "none";
    cb(val);
};

ColorPicker.prototype.cancel = function(){
    this.picker.exit();
    document.querySelector("#color-picker-popup").style.display = "none";
};
