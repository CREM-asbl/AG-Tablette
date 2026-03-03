import { TranslateTool } from './TranslateTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new TranslateTool();
    }
    return _instance;
  },
};
