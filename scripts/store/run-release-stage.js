import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import {
  getRequestedPlatforms,
  getStageCommands,
  loadStoreConfig,
  normalizePlatform,
  readJsonFile,
  resolveFromRepo,
} from './release-lib.js';

function parseArgs(argv) {
  const options = {
    stage: 'publish',
    platform: 'all',
    config: 'store/store.config.json',
    cleanGenerated: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const nextValue = argv[index + 1];

    if (current === '--stage' && nextValue) {
      options.stage = nextValue;
      index += 1;
    } else if (current === '--platform' && nextValue) {
      options.platform = normalizePlatform(nextValue);
      index += 1;
    } else if (current === '--config' && nextValue) {
      options.config = nextValue;
      index += 1;
    } else if (current === '--clean-generated') {
      options.cleanGenerated = true;
    }
  }

  return options;
}

function buildStageEnvironment({ releaseContext, platform }) {
  return {
    ...process.env,
    AG_STORE_PLATFORM: platform,
    AG_STORE_TRACK: releaseContext.release.track,
    AG_STORE_CONTEXT_PATH: resolveFromRepo(join(releaseContext.release.generatedDir, 'release-context.json')),
    AG_STORE_VERSION_RAW: releaseContext.version.raw,
    AG_STORE_VERSION_SEMVER: releaseContext.version.semver,
    AG_STORE_ANDROID_VERSION_CODE: String(releaseContext.version.androidVersionCode),
    AG_STORE_WINDOWS_VERSION: releaseContext.version.windowsVersion,
    AG_PLAY_PACKAGE_ID: releaseContext.app.playPackageId,
    AG_WINDOWS_PRODUCT_ID: releaseContext.app.windowsProductId,
  };
}

function runStageCommand(stageCommand, releaseContext) {
  const result = spawnSync(stageCommand.command, {
    cwd: resolveFromRepo(stageCommand.cwd),
    env: buildStageEnvironment({ releaseContext, platform: stageCommand.platform }),
    shell: true,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Stage command failed for ${stageCommand.platform}: ${stageCommand.command}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const { config } = loadStoreConfig(options.config);
  const requestedEnabledPlatforms = getRequestedPlatforms(config, options.platform, { enabledOnly: true });
  const stageCommands = getStageCommands({
    config,
    platform: options.platform,
    stage: options.stage,
  });

  if (requestedEnabledPlatforms.length === 0) {
    throw new Error('No enabled store platform matches the request. Update store/store.config.json first.');
  }

  if (options.stage === 'publish' && stageCommands.length !== requestedEnabledPlatforms.length) {
    const configuredPlatforms = new Set(stageCommands.map((entry) => entry.platform));
    const missingPlatforms = requestedEnabledPlatforms.filter((platform) => !configuredPlatforms.has(platform));
    throw new Error(
      `Missing ${options.stage} command for: ${missingPlatforms.join(', ')}. Update store/store.config.json.`,
    );
  }

  const releaseContext = readJsonFile(resolveFromRepo(join(config.release.generatedDir, 'release-context.json')));

  for (const stageCommand of stageCommands) {
    runStageCommand(stageCommand, releaseContext);
  }

  if (options.cleanGenerated) {
    rmSync(resolveFromRepo(config.release.generatedDir), { recursive: true, force: true });
  }
}

main();
