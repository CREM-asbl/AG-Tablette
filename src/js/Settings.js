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
   */
  set(name, value) {
    this.data[name] = {
      value: value,
    };
  }

  saveToObject() {
    return { ...this.data };
  }

  initFromObject(save) {
    this.data = { ...save };
  }
}
