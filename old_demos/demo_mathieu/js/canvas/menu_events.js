
/**
 * Called when clicking on the add square button
 */
App.events.menu.AddsquareBtn = function(e) {
	App.selectedShapeInMenu = "square";
	App.setMainMode("addShape");
};
document.getElementById("leftmenu_btn1").onclick = App.events.menu.AddsquareBtn;

/**
 * Called when clicking on the rotate square button
 */
App.events.menu.RotateShapeBtn = function(e) {
	App.setMainMode("rotateShape");
};
document.getElementById("leftmenu_btn2").onclick = App.events.menu.RotateShapeBtn;

/**
 * Called when clicking on the interact mode button
 */
App.events.menu.InteractBtn = function(e) {
	App.setMainMode("none");
};
document.getElementById("leftmenu_btn3").onclick = App.events.menu.InteractBtn;
