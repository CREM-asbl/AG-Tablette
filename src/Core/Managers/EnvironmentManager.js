import { app } from '../App';
import { Environment } from '../Environments/Environment';

export class EnvironmentManager {
  static setEnvironment(envName) {
    app.environment = new Environment(envName);
    window.dispatchEvent(new CustomEvent('env-created'));
  }
}
