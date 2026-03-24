import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { DivideTool } from './DivideTool';
import './divide-popup';
import { divideHelpConfig } from './divide.helpConfig';

let _helpRegistered = false;
const ensureHelpRegistration = () => {
  if (_helpRegistered) return;
  helpConfigRegistry.register('divide', divideHelpConfig);
  _helpRegistered = true;
};

let _instance = null;

export default {
  get tool() {
    ensureHelpRegistration();
    if (!_instance) {
      _instance = new DivideTool();
    }
    return _instance;
  },
};
