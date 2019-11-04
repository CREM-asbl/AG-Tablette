export class Settings {
  constructor() {
    //Liste des paramètres (ne pas y accéder directement);
    this.data = {};
  }

  /**
   * Renvoie la valeur d'un paramètre
   * @param  {String} name le nom du paramètre
   * @return {Object}              sa valeur
   */
  get(name) {
    if (!this.data[name]) {
      console.log('Settings.get(): Le paramètre ' + name + " n'existe pas.");
      return;
    }
    return this.data[name].value;
  }

  /**
   * AJoute un paramètre
   * @param  {String}  name       le nom du paramètre
   * @param  {Object}  value      la valeur
   * @param  {Boolean} isEditable true si la valeur du paramètre peut être modifiée par la suite.
   * @return {[type]}             [description]
   */
  set(name, value, isEditable) {
    if (this.data[name]) {
      console.warn('Settings.set(): Le paramètre ' + name + ' existe déjà.');
    }
    this.data[name] = {
      value: value,
      isEditable: isEditable,
    };
  }

  /**
   * Modifie la valeur d'un paramètre
   * @param  {String} name  le nom du paramètre
   * @param  {Object} value la nouvelle valeur
   */
  update(name, value) {
    if (!this.data[name]) {
      console.log('Settings.update(): Le paramètre ' + name + " n'existe pas.");
      return;
    }
    if (!this.data[name].isEditable) {
      console.log('Settings.update(): Le paramètre ' + name + " n'est pas éditable.");
      return;
    }
    this.data[name].value = value;
  }

  saveToObject() {
    return { ...this.data };
  }

  initFromObject(save) {
    this.data = { ...save };
  }
}
