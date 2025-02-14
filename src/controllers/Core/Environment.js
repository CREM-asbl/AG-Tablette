import { tools } from '@store/tools';
import { loadKit, resetKit } from '../../store/kit';
import { app, setState } from './App';

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

    config.default.kit ? await loadKit(name) : resetKit();
    await loadModules(config.default.modules);

    setState({
      appLoading: false,
      environment: new Environment(config.default)
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
  const toolsData = modules.map((module) => {
    if (module.default)
      return {
        name: module.default.tool.name,
        title: module.default.tool.title,
        type: module.default.tool.type,
        isVisible: true,
      };
  }).filter(Boolean);
  tools.set(toolsData)
};


/**
 * Environnement de travail: Grandeurs, Tangram, Cube... Un environnement
 * détermine les familles de figures que l'on peut utiliser, et les actions que
 * l'on peut réaliser.
 */
export class Environment {
  constructor({ name, extensions, themeColor, themeColorSoft, textColor }) {
    this.name = name;
    this.extensions = extensions;

    // this.kitName = kitContent ? kitContent.name : this.name;
    // this.families = kitContent ? kitContent.families : []

    document.documentElement.style.setProperty('--theme-color', themeColor);
    document.documentElement.style.setProperty('--theme-color-soft', themeColorSoft);
    document.documentElement.style.setProperty('--text-color', textColor);
    document.querySelector('meta[name="theme-color"]').setAttribute("content", document.documentElement.style.getPropertyValue('--theme-color-soft'));
  }
}
