import { GrandeurEnvironment } from './Environments/Grandeur';

export class EnvironmentManager {
  constructor() {
    this.environments = {
      Grandeur: GrandeurEnvironment,
    };
  }

  getNewEnv(envName) {
    window.dispatchEvent(new CustomEvent('new-env', { detail: { envName: envName } }));
    if (this.environments[envName]) {
      return new this.environments[envName]();
    } else {
      console.error('Env not found');
      return null;
    }
  }
}
