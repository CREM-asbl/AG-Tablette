import './scalar-popup';
import { ScalarMultiplicationTool } from './ScalarMultiplication';

let _instance = null;

export default {
  get tool() {
    if (!_instance) {
      _instance = new ScalarMultiplicationTool();
    }
    return _instance;
  },
};
