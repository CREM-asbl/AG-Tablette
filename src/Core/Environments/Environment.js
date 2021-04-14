import { app } from '../App';
import { Family } from '../Objects/Family';

export const loadEnvironnement = async name => {
  try {
    const config = await import(`./${name}.js`)
    await loadModules(config.default.modules)
    if (config.default.settings) app.settings.update(config.default.settings)

    return new Environment(config.default, await loadKit(config.default.kit))
  }
  catch (error) {
    console.warn(`Environnement ${name} pas encore pris en charge`);
    console.log(error)
  }
}

const loadModules = async list => {
  const modules = await Promise.all(list.map(async module => await import(`../../${module}/index.js`)))
  app.states = modules.map(module => module.default.state)
}

const loadKit = async name => {
  if(!name) return null
  const module = await import(`../ShapesKits/${name}.js`)
  const kit = module[name]
  let families = []
  for (let [familyName, familyData] of Object.entries(kit.families)) {
    families.push(new Family({ name: familyName, ...familyData }));
  }
  const kitContent = {name: kit.name, families}
  return kitContent;
}

/**
 * Environnement de travail: Grandeurs, Tangram, Cube... Un environnement
 * détermine les familles de formes que l'on peut utiliser, et les actions que
 * l'on peut réaliser.
 */
export class Environment {
  constructor({ name, extension, themeColor, themeColorSoft }, kitContent = null) {
    this.name = name;

    this.extension = extension

    this.kitName = this.name;

    document.documentElement.style.setProperty('--theme-color', themeColor);
    document.documentElement.style.setProperty('--theme-color-soft', themeColorSoft);

    this.families = [];
    if (kitContent) {
      this.kitName = kitContent.name;

      this.families = kitContent.families;
    }
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
