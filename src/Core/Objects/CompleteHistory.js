import { Shape } from './Shape';
import { ShapeGroup } from './ShapeGroup';

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

    this.startTangram = app.tangram;
  }

  saveToObject() {
    let save = {
      steps: this.steps, //.map(step => step.saveToObject()),
      startTimestamp: this.startTimestamp,
      endTimestamp: Date.now(), //this.endTimestamp,
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
    this.startShapes = object.startShapes.map(s => {
      let shape = new Shape({ x: 0, y: 0 }, null, name, this.name);
      shape.initFromObject(s);
      shape.id = s.id;
      return shape;
    });
    this.startShapeGroups = object.startShapeGroups.map(groupData => {
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
