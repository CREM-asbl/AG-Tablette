
function ColorPicker(app) {
    this.app = app;

    this.picker = new CP(document.querySelector('input#color-picker-input'), false);
	this.picker.on("change", function(color) {
        this.target.value = '#' + color;
    });
    this.callback = null;
}

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

ColorPicker.prototype.setColor = function(color) {
    this.picker.target.value = color;
}

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
