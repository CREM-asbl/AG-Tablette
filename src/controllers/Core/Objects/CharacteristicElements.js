import { findObjectById } from '../Tools/general';

/**
 * Représente le ou les éléments caractéristiques d'un transformation
 */
export class CharacteristicElements {
  constructor({ type = '', elementIds = [], clockwise = false }) {
    this.type = type;
    this.elementIds = [...elementIds];
    this.clockwise = clockwise;
  }

  equal(characteristicElements) {
    if (
      this.type === characteristicElements.type &&
      this.clockwise === characteristicElements.clockwise
    ) {
      if (
        this.elementIds.length === characteristicElements.elementIds.length &&
        this.elementIds.every(
          (elem, index) => elem === characteristicElements.elementIds[index],
        )
      ) {
        return true;
      }
    }
    return false;
  }

  get elements() {
    return this.elementIds.map((elId) => findObjectById(elId));
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

  saveData() {
    const data = {
      type: this.type,
      elementIds: [...this.elementIds],
      clockwise: this.clockwise,
    };
    return data;
  }
}
