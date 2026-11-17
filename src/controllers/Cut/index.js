import { CutTool } from './CutTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new CutTool();
    }
    return _instance;
  },
};
