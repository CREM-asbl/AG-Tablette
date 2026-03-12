import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { CreateTool } from './CreateTool';
import { createHelpConfig } from './create.helpConfig';

let _helpRegistered = false;
const ensureHelpRegistration = () => {
  if (_helpRegistered) return;
  helpConfigRegistry.register('create', createHelpConfig);
  _helpRegistered = true;
};

let _instance = null;

export default {
  get tool() {
    ensureHelpRegistration();
    if (!_instance) {
      _instance = new CreateTool();
    }
    return _instance;
  },
};
