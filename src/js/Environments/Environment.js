import { Family } from '../Objects/Family';

/**
 * Environnement de travail: Grandeur, Tangram, Cube... Un environnement
 * détermine les familles de formes que l'on peut utiliser, et les actions que
 * l'on peut réaliser.
 */
export class Environment {
  constructor(name) {
    this.name = name;

    this.families = [];

    this.familyNames = [];

    import(`./${name}.js`);
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
