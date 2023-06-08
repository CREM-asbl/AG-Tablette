import { findObjectById } from "../Tools/general";

/**
 * Représente le ou les éléments caractéristiques d'un transformation
 */
export class CharacteristicElements {
  constructor({
    type = '',
    elementIds = [],
  }) {
    this.type = type;
    this.elementIds = [...elementIds];
  }

  equal(characteristicElements) {
    if (this.type == characteristicElements.type) {
      if (this.elementIds.length == characteristicElements.elementIds.length && this.elementIds.every((elem, index) => elem === characteristicElements.elementIds[index])) {
        return true;
      }
    }
    return false;
  }

  get elements() {
    return this.elementIds.map(elId => findObjectById(elId));
  }

  get firstElement() {
    return findObjectById(this.elementIds[0]);
  }

  get secondElement() {
    return findObjectById(this.elementIds[1]);
  }

  get thirdElement() {
    return findObjectById(this.elementIds[2]);
  }

  get fourthElement() {
    return findObjectById(this.elementIds[3]);
  }
}
