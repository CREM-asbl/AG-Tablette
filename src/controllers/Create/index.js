import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { CreateTool } from './CreateTool';
import { createHelpConfig } from './create.helpConfig';

// Enregistrer la config d'aide dès le chargement du module
helpConfigRegistry.register('create', createHelpConfig);

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreateTool();
    }
    return _instance;
  },
};
