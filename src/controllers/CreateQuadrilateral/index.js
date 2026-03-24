import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { CreateQuadrilateralTool } from './CreateQuadrilateralTool';
import { createQuadrilateralHelpConfig } from './createQuadrilateral.helpConfig';

let _helpRegistered = false;
const ensureHelpRegistration = () => {
  if (_helpRegistered) return;
  helpConfigRegistry.register('createQuadrilateral', createQuadrilateralHelpConfig);
  _helpRegistered = true;
};

let _instance = null;

export default {
  get tool() {
    ensureHelpRegistration();
    if (!_instance) {
      _instance = new CreateQuadrilateralTool();
    }
    return _instance;
  },
};
