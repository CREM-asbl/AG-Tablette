/**
 * This class represent the state of the application: are we currently adding shapes ? moving or rotating them?
 */

/**
 * Constructor
 */
function State() {
	this.isRotating = false;
	this.rotateData = {
		"shapeId": null,
		"startAngle": null
	};

	this.isMoving = false;
	this.moveData = {
		"shapeId": null
	};

	this.isDeleting = false;
	this.deleteData = {
	};

	this.isCreating = false;
	this.createData = {
		"selectedFamily": null,
		"selectedShape": null
	};

	this.isSelecting = false;
	this.selectingData = {
		"selectedShapes": []
	};
}

/**
 * Update the app state (creating shapes context)
 */
State.prototype.setCreating = function(familyRef, shapeRef) {
	this.unsetMoving();

	this.createData.selectedFamily = familyRef;
	this.createData.selectedShape = shapeRef;
	this.isCreating = true;
};

/**
 * Update the app state (terminate creating context)
 */
State.prototype.unsetCreating = function() {
	this.createData.selectedFamily = null;
	this.createData.selectedShape = null;
	this.isCreating = false;
};

/**
 * Update the app state (moving shape context)
 */
State.prototype.setMoving = function() {
	this.unsetCreating();

	this.isMoving = true;

	this.moveData.shapeId = null;
};

/**
 * Update the app state (terminate moving context)
 */
State.prototype.unsetMoving = function() {
	if(this.moveData.shapeId!=null) {
		//todo: do anything? or not?
	}
	this.moveData.shapeId = null;
	this.isMoving = false;
};

