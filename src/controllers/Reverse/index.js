import { ReverseTool } from './ReverseTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new ReverseTool();
    }
    return _instance;
  },
};
