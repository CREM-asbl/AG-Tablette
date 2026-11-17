import { BifaceTool } from './BifaceTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new BifaceTool();
    }
    return _instance;
  },
};
