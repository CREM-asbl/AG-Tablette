import { DivideTool } from './DivideTool';
import './divide-popup';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new DivideTool();
    }
    return _instance;
  },
};
