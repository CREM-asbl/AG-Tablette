import { tools } from '@store/tools';
import { loadKit, resetKit } from '../../store/kit';
import { app, setState } from './App';

export const loadEnvironnement = async (name) => {
  try {
    // Validation du nom d'environnement
    if (!name || typeof name !== 'string') {
      throw new Error('Nom d\'environnement invalide');
    }

    setState({ appLoading: true });
    
    const config = await import(`./Environments/${name}.js`);
    
    if (!config.default) {
      throw new Error(`Configuration d'environnement non trouvée pour "${name}"`);
    }

    // Validation de la structure de configuration
    if (!config.default.name) {
      throw new Error(`Nom manquant dans la configuration de l'environnement "${name}"`);
    }

    if (config.default.settings) {
      setState({
        settings: { ...app.settings, ...config.default.settings },
        history: { ...app.history, startSettings: { ...app.history.startSettings, ...config.default.settings } },
        defaultState: { ...app.defaultState, settings: { ...app.settings } }
      });
    }

    // Chargement conditionnel du kit avec gestion d'erreur
    try {
      config.default.kit ? await loadKit(name) : resetKit();
    } catch (kitError) {
      console.warn(`Erreur lors du chargement du kit pour ${name}:`, kitError);
      // Continuer sans kit si échec
      resetKit();
    }

    await loadModules(config.default.modules);

    setState({
      appLoading: false,
      environment: new Environment(config.default)
    });

    console.log(`Environnement "${name}" chargé avec succès`);
  } catch (error) {
    console.error(`Erreur lors du chargement de l'environnement "${name}":`, error);
    setState({ appLoading: false });
    
    // Notifier l'utilisateur
    window.dispatchEvent(new CustomEvent('show-notif', { 
      detail: { message: `Erreur lors du chargement de l'environnement: ${error.message}` } 
    }));
    
    throw error;
  }
};

const loadModules = async (list) => {
  try {
    // Validation de la liste des modules
    if (!Array.isArray(list)) {
      throw new Error('La liste des modules doit être un tableau');
    }

    if (list.length === 0) {
      console.warn('Aucun module à charger');
      tools.set([]);
      return;
    }

    const modules = await Promise.all(
      list.map(async (module) => {
        try {
          if (!module || typeof module !== 'string') {
            throw new Error(`Nom de module invalide: ${module}`);
          }
          return await import(`../${module}/index.js`);
        } catch (error) {
          console.error(`Erreur lors du chargement du module "${module}":`, error);
          return null; // Continuer avec les autres modules
        }
      }),
    );

    const toolsData = modules
      .filter(module => module !== null) // Filtrer les modules qui ont échoué
      .map((module) => {
        if (module.default && module.default.tool) {
          return {
            name: module.default.tool.name,
            title: module.default.tool.title,
            type: module.default.tool.type,
            isVisible: true,
          };
        }
        return null;
      })
      .filter(Boolean); // Supprimer les entrées null

    tools.set(toolsData);
    console.log(`${toolsData.length} modules chargés avec succès sur ${list.length} demandés`);
  } catch (error) {
    console.error('Erreur lors du chargement des modules:', error);
    tools.set([]); // S'assurer qu'on a au moins un tableau vide
    throw error;
  }
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
