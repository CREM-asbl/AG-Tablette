import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { DivideTool } from './DivideTool';
import { divideHelpConfig } from './divide.helpConfig';
import './divide-popup';

// Enregistrer la config d'aide dès le chargement du module
helpConfigRegistry.register('divide', divideHelpConfig);

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new DivideTool();
    }
    return _instance;
  },
};
