import { GrandeurEnvironment } from './Environments/Grandeur';
import { app } from './App';

export class EnvironmentManager {
  static init() {
    this.environments = {
      Grandeur: GrandeurEnvironment,
    };

    window.addEventListener('app-started', () => {
      EnvironmentManager.setNewEnv('Grandeur');
    });
  }

  static setNewEnv(envName) {
    console.log(envName);
    window.dispatchEvent(new CustomEvent('env-created', { detail: { envName: envName } }));
    if (this.environments[envName]) {
      app.environment = new this.environments[envName]();
    } else {
      console.error('Env not found: ' + envName);
      return null;
    }
  }
}
