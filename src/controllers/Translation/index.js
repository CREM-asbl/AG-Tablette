import { TranslationTool } from './TranslationTool';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new TranslationTool();
    }
    return _instance;
  },
};
