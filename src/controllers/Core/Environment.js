import { tools } from '@store/tools';
import { eventUtils, moduleUtils, validator } from '../../core/index.js';
import { appActions } from '../../store/appState.js';
import { loadKit, resetKit } from '../../store/kit';
import { app, setState } from './App';

export const loadEnvironnement = async (name) => {
  try {
    // Validation avec le nouveau système
    const validationResult = validator.validate(
      name,
      [
        { type: 'required' },
        { type: 'type', options: { expectedType: 'string' } },
      ],
      'environmentName',
    );

    if (!validationResult.isValid) {
      throw new Error(
        `Nom d'environnement invalide: ${validationResult.getAllMessages().join(', ')}`,
      );
    }

    // Utiliser les signaux Lit pour gérer l'état
    appActions.setLoading(true);

    // Émettre événement de début de chargement
    eventUtils.emit('environment:loading', { name });

    const config = await import(`./Environments/${name}.js`);

    if (!config.default) {
      throw new Error(
        `Configuration d'environnement non trouvée pour "${name}"`,
      );
    }

    // Validation de la configuration avec le système de validation
    const configValidation = validator.validateSchema(
      config.default,
      'environment',
    );
    if (!configValidation.isValid) {
      throw new Error(
        `Configuration invalide: ${configValidation.getAllMessages().join(', ')}`,
      );
    }

    if (config.default.settings) {
      setState({
        settings: { ...app.settings, ...config.default.settings },
        history: {
          ...app.history,
          startSettings: {
            ...app.history.startSettings,
            ...config.default.settings,
          },
        },
        defaultState: { ...app.defaultState, settings: { ...app.settings } },
      });

      // Synchroniser avec les signaux Lit
      appActions.updateSettings(config.default.settings);
    }

    // Chargement conditionnel du kit avec gestion d'erreur
    try {
      config.default.kit ? await loadKit(name) : resetKit();
    } catch (kitError) {
      console.warn(`Erreur lors du chargement du kit pour ${name}:`, kitError);
      eventUtils.emit('environment:kit-error', { name, error: kitError });
      resetKit();
    }

    await loadModules(config.default.modules);

    const environment = new Environment(config.default);

    setState({
      appLoading: false,
      environment,
    });

    // Synchroniser avec les signaux Lit
    appActions.setLoading(false);
    appActions.setEnvironment(environment);
    appActions.setEnvironmentConfig(config.default);
    appActions.setEnvironmentModules(config.default.modules);

    // Émettre événement de succès
    eventUtils.emit('environment:loaded', {
      name,
      environment,
      modules: config.default.modules,
    });

    if (import.meta.env.DEV)
      console.log(`Environnement "${name}" chargé avec succès`);
  } catch (error) {
    console.error(
      `Erreur lors du chargement de l'environnement "${name}":`,
      error,
    );

    setState({ appLoading: false });
    appActions.setLoading(false);
    appActions.setError(error.message);

    // Émettre événement d'erreur
    eventUtils.emit('environment:error', { name, error });

    // Notifier l'utilisateur
    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: {
          message: `Erreur lors du chargement de l'environnement: ${error.message}`,
        },
      }),
    );

    throw error;
  }
};

const loadModules = async (list) => {
  try {
    // Validation avec le nouveau système
    const validationResult = validator.validate(
      list,
      [
        { type: 'required' },
        { type: 'type', options: { expectedType: 'array' } },
      ],
      'moduleList',
    );

    if (!validationResult.isValid) {
      throw new Error(
        `Liste de modules invalide: ${validationResult.getAllMessages().join(', ')}`,
      );
    }

    if (list.length === 0) {
      console.warn('Aucun module à charger');
      tools.set([]);
      return;
    }

    // Émettre événement de début de chargement des modules
    eventUtils.emit('modules:loading', { modules: list });

    const loadedModules = [];
    const failedModules = [];

    for (const moduleName of list) {
      try {
        // Validation du nom de module
        const moduleValidation = validator.validate(
          moduleName,
          [
            { type: 'required' },
            { type: 'type', options: { expectedType: 'string' } },
          ],
          'moduleName',
        );

        if (!moduleValidation.isValid) {
          failedModules.push({
            name: moduleName,
            error: `Nom invalide: ${moduleValidation.getAllMessages().join(', ')}`,
          });
          continue;
        }

        // Charger le module via les utilitaires
        let module;
        try {
          module = await import(`../${moduleName}/index.js`);
        } catch (moduleError) {
          failedModules.push({
            name: moduleName,
            error: moduleError.message,
          });
          continue;
        }

        const toolMetadata = moduleUtils.extractToolMetadata(module);
        if (toolMetadata) {
          loadedModules.push(toolMetadata);
        } else {
          failedModules.push({
            name: moduleName,
            error: 'Structure de module invalide',
          });
        }
      } catch (error) {
        console.error(
          `Erreur lors du chargement du module "${moduleName}":`,
          error,
        );
        failedModules.push({
          name: moduleName,
          error: error.message,
        });
      }
    }

    tools.set(loadedModules);

    // Émettre événements de résultat
    if (loadedModules.length > 0) {
      eventUtils.emit('modules:loaded', {
        modules: loadedModules,
        total: list.length,
        loaded: loadedModules.length,
      });
    }

    if (failedModules.length > 0) {
      eventUtils.emit('modules:failed', {
        failed: failedModules,
        total: list.length,
      });
    }

    if (import.meta.env.DEV)
      console.log(
        `${loadedModules.length} modules chargés avec succès sur ${list.length} demandés`,
      );

    if (failedModules.length > 0) {
      console.warn('Modules ayant échoué:', failedModules);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des modules:', error);
    tools.set([]);
    eventUtils.emit('modules:error', { error });
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
    // Validation des paramètres avec le nouveau système
    const validationResult = validator.validateSchema(
      {
        name,
        themeColor,
        themeColorSoft,
        textColor,
      },
      {
        name: [
          { type: 'required' },
          { type: 'type', options: { expectedType: 'string' } },
        ],
        themeColor: [{ type: 'color' }],
        themeColorSoft: [{ type: 'color' }],
        textColor: [{ type: 'color' }],
      },
    );

    if (!validationResult.isValid) {
      console.warn(
        "Paramètres d'environnement invalides:",
        validationResult.getAllMessages(),
      );
    }

    this.name = name;
    this.extensions = extensions;

    // Appliquer le thème avec validation
    this.applyTheme(themeColor, themeColorSoft, textColor);

    // Émettre événement de création d'environnement
    eventUtils.emit('environment:created', {
      name: this.name,
      extensions: this.extensions,
      theme: { themeColor, themeColorSoft, textColor },
    });
  }

  /**
   * Appliquer le thème à l'environnement
   * @param {string} themeColor - Couleur principale
   * @param {string} themeColorSoft - Couleur secondaire
   * @param {string} textColor - Couleur du texte
   */
  applyTheme(themeColor, themeColorSoft, textColor) {
    try {
      if (themeColor) {
        document.documentElement.style.setProperty('--theme-color', themeColor);
      }
      if (themeColorSoft) {
        document.documentElement.style.setProperty(
          '--theme-color-soft',
          themeColorSoft,
        );
        // Mettre à jour la meta theme-color
        const metaThemeColor = document.querySelector(
          'meta[name="theme-color"]',
        );
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', themeColorSoft);
        }
      }
      if (textColor) {
        document.documentElement.style.setProperty('--text-color', textColor);
      }

      eventUtils.emit('environment:theme-applied', {
        themeColor,
        themeColorSoft,
        textColor,
      });
    } catch (error) {
      console.error("Erreur lors de l'application du thème:", error);
      eventUtils.emit('environment:theme-error', { error });
    }
  }

  /**
   * Obtenir les informations de l'environnement
   * @returns {object}
   */
  getInfo() {
    return {
      name: this.name,
      extensions: this.extensions,
      theme: {
        themeColor:
          document.documentElement.style.getPropertyValue('--theme-color'),
        themeColorSoft:
          document.documentElement.style.getPropertyValue('--theme-color-soft'),
        textColor:
          document.documentElement.style.getPropertyValue('--text-color'),
      },
    };
  }

  /**
   * Nettoyer l'environnement
   */
  cleanup() {
    eventUtils.emit('environment:cleanup', { name: this.name });
  }
}
