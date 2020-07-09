import { app } from '../App';
import { Environment } from '../Environments/Environment';

window.addEventListener('set-environnement', e =>
  EnvironmentManager.setEnvironment(e.detail)
);

export class EnvironmentManager {
  static setEnvironment(envName) {
    app.environment = new Environment(envName);
    window.dispatchEvent(new CustomEvent('env-created'));
  }
}
