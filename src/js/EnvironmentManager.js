import { GrandeurEnvironment } from './Environments/Grandeur';

export class EnvironmentManager {
  constructor() {
    this.environments = {
      Grandeur: GrandeurEnvironment,
    };
  }

  getNewEnv(envName) {
    if (this.environments[envName]) {
      return new this.environments[envName]();
    } else {
      console.error('Env not found');
      return null;
    }
  }
}
