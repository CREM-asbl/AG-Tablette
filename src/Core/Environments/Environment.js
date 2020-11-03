import { Family } from '../Objects/Family';
import { app } from '../App';

window.addEventListener('set-environnement', e => {
  app.environment = new Environment(e.detail);
  window.dispatchEvent(new CustomEvent('env-created'));
});

// window.addEventListener('new-window', () => {
//   app.environment =  new Environment(app.environment.name)
//   window.dispatchEvent(new CustomEvent('env-created'))
// })

/**
 * Environnement de travail: Grandeurs, Tangram, Cube... Un environnement
 * détermine les familles de formes que l'on peut utiliser, et les actions que
 * l'on peut réaliser.
 */
export class Environment {
  constructor(name) {
    this.name = name;

    this.kitName = '';

    this.families = [];

    // Build à besoin d'avoir les noms des fichiers pour les bundles
    // Todo: Rendre ce chargement plus souple (custom Environnement)
    switch (name) {
      case 'Grandeurs':
        import('./Grandeurs');
        break;
      case 'Tangram':
        import('./Tangram');
        break;
      case 'Cubes':
        import('./Cubes');
        break;
      case 'Geometrie':
        import('./Geometrie');
        break;
      default:
        console.alert(`Environnement ${name} pas encore pris en charge`);
    }
  }

  // async load(file) {
  //   const response = await fetch(`data/${file}`)
  //   const data = await response.json()
  //   this.loadModules(data.modules)
  //   this.extension = data.extension
  // }

  // loadModules(modules) {
  //   modules.forEach(module => {
  //     import(`../../${module}/${module}State.js`)
  //     import(`../../${module}/${module}Action.js`)
  //     // new `${module}State`()
  //     // new `${module}Action`()
  //   })
  // }

  /**
   * Charger les familles de l'environnement à partir d'un kit
   * @param  {Data} kit données du kit à charger
   */
  loadFamilies(kit) {
    this.kitName = kit.name;
    for (let [familyName, familyData] of Object.entries(kit.families)) {
      this.families.push(new Family({ name: familyName, ...familyData }));
    }
    // this.families = [this.families[0]];
    window.dispatchEvent(new CustomEvent('families-loaded'));
  }

  /**
   * Renvoie la liste des noms des familles de formes
   * @return {[String]}
   */
  get familyNames() {
    if (this.families) return this.families.map(f => f.name);
    else return [];
  }

  /**
   * Récupère une famille à partir de son nom
   * @param {String}  name    le nom de la famille
   * @return {Family}
   */
  getFamily(name) {
    let list = this.families.find(family => family.name === name);
    return list;
  }
}
