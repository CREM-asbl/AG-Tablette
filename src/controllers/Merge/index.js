import { MergeTool } from './MergeTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new MergeTool();
    }
    return _instance;
  },
};
