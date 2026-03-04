import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { CreateQuadrilateralTool } from './CreateQuadrilateralTool';
import { createQuadrilateralHelpConfig } from './createQuadrilateral.helpConfig';

// Enregistrer la config d'aide dès le chargement du module
helpConfigRegistry.register('createQuadrilateral', createQuadrilateralHelpConfig);

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreateQuadrilateralTool();
    }
    return _instance;
  },
};
