import { ShapeGroup } from './ShapeGroup';
import { Shape } from './Shape';
import { Point } from './Point';

/**
 * Représente l'historique d'un espace de travail.
 */
export class CompleteHistory {
  constructor(startTimestamp) {
    // Historique des actions
    this.steps = [];

    // index de la prochaine action à effectuer
    this.historyIndex = null;

    // timestamp courant
    this.currentTimestamp = null;

    // start of the video
    this.videoStartTimestamp = null;

    // workspace open timestamp
    this.startTimestamp = startTimestamp;

    // workspace close timestamp
    this.endTimestamp = 0;

    // timeout id for cancelling
    this.timeoutId = null;

    // the shapes that were there when the record starts
    this.startShapes = [];

    // the groups that were there when the record starts
    this.startShapeGroups = [];

    this.startZoomLevel = 1;

    this.startTranslateOffset = new Point(0, 0);

    this.startSilhouette = app.silhouette;
  }

  saveToObject() {
    let save = {
      steps: this.steps, //.map(step => step.saveToObject()),
      startTimestamp: this.startTimestamp,
      endTimestamp: Date.now(), //this.endTimestamp,
      startZoomLevel: this.startZoomLevel,
      startTranslateOffset: this.startTranslateOffset,
      startShapes: this.startShapes.map(s => s.saveToObject()),
      startShapeGroups: this.startShapeGroups.map(group => group.saveToObject()),
      startTangram: this.startTangram,
    };
    return save;
  }

  initFromObject(object) {
    this.steps = object.steps;
    this.startTimestamp = object.startTimestamp;
    this.endTimestamp = object.endTimestamp;
    this.startZoomLevel = object.startZoomLevel;
    this.startTranslateOffset = object.startTranslateOffset;
    this.startShapes = object.startShapes?.map(s => Shape.fromObject(s));
    this.startShapeGroups = object.startShapeGroups?.map(groupData => {
      let group = new ShapeGroup(0, 1);
      group.initFromObject(groupData);
      return group;
    });
    this.startTangram = object.startTangram;
  }

  // transformToObject(detail) {
  //   if (!detail)
  //     return;
  //   let savedDetail = {};
  //   for (let [key, value] of Object.entries(detail)) {
  //     if (value instanceof Shape || value instanceof Segment || value instanceof Point)
  //       value = value.saveToObject();
  //     else if (value instanceof Array)
  //       value = value.map(elem => {
  //         if (elem instanceof Shape || elem instanceof Segment || elem instanceof Point)
  //           return elem.saveToObject();
  //         else return elem;
  //       });
  //     savedDetail[key] = value;
  //   }
  //   return savedDetail;
  // }

  /**
   * Ajouter une étape (ensemble d'action) à l'historique (l'étape n'est pas
   * exécutée, il est supposé qu'elle a déjà été exécutée).
   */
  addStep(type, detail, timeStamp) {
    this.steps.push({ type, detail: detail, timestamp: timeStamp + this.endTimestamp });
  }
}
