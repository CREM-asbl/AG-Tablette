import { CreateQuadrilateralTool } from './CreateQuadrilateralTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreateQuadrilateralTool();
    }
    return _instance;
  },
};
