import { app, setState } from './App';
import { Family } from './Objects/Family';

export const loadEnvironnement = async (name) => {
  try {
    setState({ appLoading: true })
    const config = await import(`./Environments/${name}.js`);
    if (config.default.settings) {
      setState({
        settings: { ...app.settings, ...config.default.settings },
        history: { ...app.history, startSettings: { ...app.history.startSettings, ...config.default.settings } },
        defaultState: { ...app.defaultState, settings: { ...app.settings } }
      });
    }
    await loadModules(config.default.modules);

    setState({
      appLoading: false,
      environment: new Environment(config.default, await loadKit(config.default.kit))
    });
  } catch (error) {
    console.info(`Environnement ${name} pas encore pris en charge`);
    console.error(error);
  }
};

const loadModules = async (list) => {
  const modules = await Promise.all(
    list.map(async (module) => await import(`../${module}/index.js`)),
  );
  let tools = modules.map((module) => {
    // module.default.tool.isVisible = true
    // return module.default.tool
    if (module.default)
      return {
        name: module.default.tool.name,
        title: module.default.tool.title,
        type: module.default.tool.type,
        isVisible: true,
      };
  }).filter(Boolean);
  setState({ tools });
};

const loadKit = async (name) => {
  if (!name) return null;
  const module = await import(`./ShapesKits/${name}.js`);
  const kit = module[name];
  const families = kit.families.map(family => new Family(family));
  const kitContent = { name: kit.name, families };
  return kitContent;
};

/**
 * Environnement de travail: Grandeurs, Tangram, Cube... Un environnement
 * détermine les familles de figures que l'on peut utiliser, et les actions que
 * l'on peut réaliser.
 */
export class Environment {
  constructor({ name, extensions, themeColor, themeColorSoft, textColor }, kitContent = null) {
    this.name = name;

    this.extensions = extensions;

    this.kitName = kitContent ? kitContent.name : this.name;
    this.families = kitContent ? kitContent.families : []

    document.documentElement.style.setProperty('--theme-color', themeColor);
    document.documentElement.style.setProperty('--theme-color-soft', themeColorSoft);
    document.documentElement.style.setProperty('--text-color', textColor);
    document.querySelector('meta[name="theme-color"]').setAttribute("content", document.documentElement.style.getPropertyValue('--theme-color-soft'));
  }

  /**
   * Renvoie la liste des noms des familles de figures
   * @return {[String]}
   */
  get familyNames() {
    if (this.families) return this.families.map((f) => f.name);
    else return [];
  }

  /**
   * Récupère une famille à partir de son nom
   * @param {String}  name    le nom de la famille
   * @return {Family}
   */
  getFamily(name) {
    let list = this.families.find((family) => family.name === name);
    return list;
  }
}
