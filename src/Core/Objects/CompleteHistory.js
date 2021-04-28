import { app } from '../App';
import { Coordinates } from './Coordinates';

/**
 * Représente l'historique d'un espace de travail.
 */
export class CompleteHistory {
  constructor() {
    // Historique des actions
    this.steps = [];

    // index de la prochaine action à effectuer
    this.historyIndex = null;

    // timeout id for cancelling
    this.timeoutId = null;

    // this.startSilhouette = app.silhouette;
  }

  saveToObject() {
    let save = {
      steps: this.steps, //.map(step => step.saveToObject()),
      // startTangram: this.startTangram,
    };
    return save;
  }

  initFromObject(object) {
    this.steps = object.steps;
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
  addStep(type, detail, fullStep) {
    let data = app.workspace.data;
    data.history = undefined;
    data.completeHistory = undefined;
    data.settings = {...app.settings};
    this.steps.push({
      type,
      detail: detail,
      fullStep,
      data,
    });
  }
}
