import { DuplicateTool } from './DuplicateTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new DuplicateTool();
    }
    return _instance;
  },
};
