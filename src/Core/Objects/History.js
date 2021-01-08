/**
 * Représente l'historique d'un espace de travail.
 */
export class History {
  constructor() {
    // Index de la dernière tâche réalisée
    this.index = -1;

    // Historique des actions
    this.data = [];
  }

  // transformFromPreviousVersion() {
  //   if (app.lastFileVersion == '1.0.0') {
  //     let newData = [];
  //     for (
  //       let i = this.roots.slice(-1)[0];
  //       i < this.data.length;
  //       i = this.data[i].next_step.slice(-1)[0]
  //     ) {
  //       if (this.index == i) this.index = newData.length;
  //       newData.push(
  //         this.data[i].actions.map(step => {
  //           return { name: step.className, ...step.data };
  //         })
  //       );
  //     }
  //     this.data = newData;
  //     HistoryManager.updateBackup();
  //   }
  // }

  get length() {
    return this.data.length;
  }

  saveToObject() {
    let save = {
      index: this.index,
      data: this.data,
    };
    return save;
  }

  initFromObject(object) {
    this.index = object.index;
    this.data = object.data;
    // if (app.lastFileVersion == '1.0.0') {
    //   this.transformFromPreviousVersion();
    // }
  }

  resetToDefault() {
    this.index = -1;
    this.data = [];
  }
}
