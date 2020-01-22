import { app } from './App';
import { Environment } from './Environments/Environment';

export class EnvironmentManager {
  static setEnvironment(envName) {
    new Environment(envName);

    window.dispatchEvent(new CustomEvent('env-changed', { detail: { envName: envName } }));
  }
}
