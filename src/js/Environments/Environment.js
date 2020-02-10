import { Family } from '../Objects/Family';

/**
 * Environnement de travail: Grandeurs, Tangram, Cube... Un environnement
 * détermine les familles de formes que l'on peut utiliser, et les actions que
 * l'on peut réaliser.
 */
export class Environment {
  constructor(name) {
    this.name = name;

    this.families = [];

    this.familyNames = [];

    //Build à besoin d'avoir les noms des fichiers pour les bundles
    switch (name) {
      case 'Grandeurs':
        import('./Grandeurs');
        break;
      case 'Tangram':
        import('./Tangram');
        break;
    }

    switch (this.name) {
      case 'Grandeurs':
        this.extension = 'agg';
        break;
      case 'Tangram':
        this.extension = 'agt';
        break;
      case 'Cube':
        this.extension = 'agc';
        break;
      case 'Géométrie':
        this.extension = 'agl';
        break;
      default:
        this.extension = 'json';
    }
  }

  /**
   * Charger les familles de l'environnement à partir d'un kit
   * @param  {Data} kit données du kit à charger
   */
  loadFamilies(kit) {
    for (let familyName of Object.keys(kit)) {
      let familyData = kit[familyName];
      let family = new Family(familyName, familyData.color);
      familyData.shapes.forEach(shape => {
        family.addShape(shape.name, shape.segments, shape.color);
      });
      this.families.push(family);
      this.familyNames.push(familyName);
    }
  }

  /**
   * Renvoie la liste des noms des familles de formes
   * @return liste des noms ([String])
   */
  getFamiliesNames() {
    return this.families.map(f => f.name);
  }

  /**
   * Récupère une famille à partir de son nom
   * @param name: le nom de la famille (String)
   * @return la famille (Family)
   */
  getFamily(name) {
    let list = this.families.find(family => family.name === name);
    return list;
  }
}
