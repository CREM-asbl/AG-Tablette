import { app } from '../App';
import { uniqId } from '../Tools/general';
import { Coordinates } from './Coordinates';
import { GroupManager } from '../Managers/GroupManager';

/**
 * Représente un texte affiché à l'écran
 */
export class Text {
  /**
   * @param {String}                      id
   * @param {DrawingEnvironment}          drawingEnvironment
   * @param {Coordinates}                 coordinates
   * @param {Number}                      x
   * @param {Number}                      y
   * @param {String}                      message   // message to display
   * @param {String}                      type      // group or biface
   * @param {String}                      referenceId
   */
  constructor({
    id = uniqId(),
    drawingEnvironment,
    coordinates = undefined,
    x = 0,
    y = 0,
    message = '',
    type = '',
    referenceId = undefined,
    color = '#000',
    size = 1,
  }) {
    this.id = id;
    this.drawingEnvironment = drawingEnvironment;
    this.drawingEnvironment.texts.push(this);

    if (coordinates !== undefined)
      this.coordinates = new Coordinates(coordinates);
    else
      this.coordinates = new Coordinates({
        x: parseFloat(x),
        y: parseFloat(y),
      });

    this.message = message;
    this.type = type;
    this.referenceId = referenceId;
    this.color = color;
    this.size = size;
  }

  get x() {
    return this.coordinates.x;
  }

  get y() {
    return this.coordinates.y;
  }

  updateMessage() {
    if (this.type == 'group') {
      let shape = app.mainDrawingEnvironment.shapes.find(
        (s) => s.id == this.referenceId,
      );
      let group = GroupManager.getShapeGroup(shape);
      if (group == null) return;
      let groupIndex = GroupManager.getGroupIndex(group);
      if (groupIndex != -1) this.message = 'Groupe ' + (groupIndex + 1);
    }
  }

  // /**
  //  * convertit en balise circle de svg
  //  */
  // toSVG(color = '#000', size = 1) {
  //   let canvasCoordinates = this.coordinates.toCanvasCoordinates();
  //   return (
  //     '<circle cx="' +
  //     canvasCoordinates.x +
  //     '" cy="' +
  //     canvasCoordinates.y +
  //     '" r="' +
  //     size * 2 + // * app.workspace.zoomLevel +
  //     '" fill="' +
  //     color +
  //     '" />\n'
  //   );
  // }
}
