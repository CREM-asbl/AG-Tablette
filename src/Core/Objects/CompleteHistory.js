import { app } from '../App';
import { Coordinates } from './Coordinates';

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

    // this.startSilhouette = app.silhouette;
  }

  saveToObject() {
    let save = {
      steps: this.steps, //.map(step => step.saveToObject()),
      startTimestamp: this.startTimestamp,
      endTimestamp: Date.now(), //this.endTimestamp,
      // startTangram: this.startTangram,
    };
    return save;
  }

  initFromObject(object) {
    this.steps = object.steps;
    this.startTimestamp = object.startTimestamp;
    this.endTimestamp = object.endTimestamp;
    // this.startTangram = object.startTangram;
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
    this.steps.push({
      type,
      detail: detail,
      timestamp: timeStamp + this.endTimestamp,
    });
  }
}
