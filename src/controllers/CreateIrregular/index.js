import { CreateIrregularTool } from './CreateIrregularTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CreateIrregularTool();
    }
    return _instance;
  },
};
