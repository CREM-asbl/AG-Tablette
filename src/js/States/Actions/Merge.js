import { app } from '../../App';
import { Action } from './Action';
import { getAverageColor } from '../../Tools/general';
import { Vertex, Segment } from '../../Objects/ShapeBuildStep';

export class MergeAction extends Action {
  constructor() {
    super();

    this.name = 'MergeAction';

    //Première forme
    this.firstShapeId = null;

    //Seconde forme
    this.secondShapeId = null;

    //Id de la forme résultant de la fusion
    this.createdShapeId = null;
  }

  saveToObject() {
    let save = {
      firstShapeId: this.firstShapeId,
      secondShapeId: this.secondShapeId,
    };
    return save;
  }

  initFromObject(save) {
    this.firstShapeId = save.firstShapeId;
    this.secondShapeId = save.secondShapeId;
  }

  checkDoParameters() {
    if (!this.firstShapeId || !this.secondShapeId) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.createdShapeId) return false;
    return true;
  }

  alertDigShape() {
    alert('Les formes creuses ne sont pas supportées actuellement');
    return false;
  }

  //Si renvoie false, annulera l'ajout à l'historique
  do() {
    if (!this.checkDoParameters()) return;

    let shape1 = app.workspace.getShapeById(this.firstShapeId),
      shape2 = app.workspace.getShapeById(this.secondShapeId);

    if (shape2.x < shape1.x) {
      [shape1, shape2] = [shape2, shape1];
    }

    let segments = [...shape1.segments, ...shape2.segments];

    // 2D array of all segments
    let segments_array = segments.map((segment, idx, segments) => {
      let segments_thats_in_segment = segments.filter(seg => segment.contains(seg));
      let newSegments = [];
      let segments_where_segment_is_in = segments.filter(
        seg => !segment.equal(seg) && seg.contains(segment),
      );

      // if segment is a subsegment of another
      if (segments_where_segment_is_in.length > 0) return newSegments;

      if (segments_thats_in_segment.length == 1)
        // no segment in it (only itself)
        newSegments.push(segment);
      else if (segments_thats_in_segment.length >= 3) {
        // if multiple segments in  segment
        console.log('shape is dig');
        return false;
      } else {
        // if another segment in segment (interior to delete)
        let part_to_delete;
        if (segments_thats_in_segment[0].equal(segment))
          part_to_delete = segments_thats_in_segment[1].copy();
        else part_to_delete = segments_thats_in_segment[0].copy();
        if (!part_to_delete.hasSameDirection(segment)) part_to_delete.reverse();
        if (!segment.vertexes[0].equal(part_to_delete.vertexes[0]))
          newSegments.push(new Segment(segment.vertexes[0], part_to_delete.vertexes[0]));
        if (!segment.vertexes[1].equal(part_to_delete.vertexes[1]))
          newSegments.push(new Segment(segment.vertexes[1], part_to_delete.vertexes[1]));
      }
      return newSegments;
    });

    if (segments_array.filter(segment => segment === false).length) return this.alertDigShape();

    // back to 1D
    segments = [].concat(...segments_array);

    const buildSteps = this.computeNewBuildSteps(segments);

    if (!buildSteps) return this.alertDigShape();

    //Créer la forme
    let newShape = shape1.copy();
    if (this.createdShapeId) newShape.id = this.createdShapeId;
    else this.createdShapeId = newShape.id;
    newShape.name = 'Custom';
    newShape.familyName = 'Custom';
    newShape.color = getAverageColor(shape1.color, shape2.color);
    newShape.borderColor = getAverageColor(shape1.borderColor, shape2.borderColor);
    newShape.isCenterShown = false;
    newShape.opacity = (shape1.opacity + shape2.opacity) / 2;
    newShape.buildSteps = buildSteps;
    newShape.setCoordinates({ x: newShape.x - 20, y: newShape.y - 20 });

    app.workspace.addShape(newShape);

    return;
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.createdShapeId);
    app.workspace.deleteShape(shape);
  }

  computeNewBuildSteps(segmentsList) {
    // Todo : Traiter le cas des formes "percées"
    // Todo : Voir si on ne peut pas la simplifier
    let newBuildSteps = [];

    let currentSegment = segmentsList[0].copy();
    let firstSegment = currentSegment;
    let nextSegment;
    let segmentUsed = 0;

    newBuildSteps.push(currentSegment);
    segmentUsed++;

    while (!firstSegment.vertexes[0].equal(currentSegment.vertexes[1])) {
      // while not closed
      const newPotentialSegments = segmentsList.filter(
        seg => !seg.equal(currentSegment) && seg.contains(currentSegment.vertexes[1], false),
      );
      if (newPotentialSegments.length != 1) {
        if (newPotentialSegments.length == 0) console.log('shape cannot be closed');
        else console.log('shape is dig');
        return null;
      }
      nextSegment = newPotentialSegments[0].copy();
      if (nextSegment.vertexes[1].equal(currentSegment.vertexes[1])) nextSegment.reverse();

      if (currentSegment.hasSameDirection(nextSegment)) {
        currentSegment.vertexes[1] = nextSegment.vertexes[1];
        currentSegment.coordinates = nextSegment.coordinates;
      } else {
        newBuildSteps.push(new Vertex(nextSegment.vertexes[0]));
        newBuildSteps.push(nextSegment);
      }
      segmentUsed++;
      currentSegment = nextSegment;
    }
    if (currentSegment.hasSameDirection(firstSegment))
      newBuildSteps[0].vertexes[0] = newBuildSteps.pop().vertexes[0];
    else newBuildSteps.push(new Vertex(currentSegment.vertexes[1]));
    if (segmentUsed != segmentsList.length) {
      console.log('shape is dig');
      return null;
    }
    return newBuildSteps;
  }
}
