import { resolve } from 'node:path';

import {
  buildReleaseContext,
  ensureDir,
  getRequestedPlatforms,
  loadStoreConfig,
  normalizePlatform,
  normalizeTrack,
  readJsonFile,
  resolveFromRepo,
  wrapperExists,
  writeJsonFile,
} from './release-lib.js';

function parseArgs(argv) {
  const options = {
    platform: 'all',
    track: 'internal',
    buildNumber: 0,
    config: 'store/store.config.json',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const nextValue = argv[index + 1];

    if (current === '--platform' && nextValue) {
      options.platform = normalizePlatform(nextValue);
      index += 1;
    } else if (current === '--track' && nextValue) {
      options.track = normalizeTrack(nextValue);
      index += 1;
    } else if (current === '--build-number' && nextValue) {
      options.buildNumber = Number.parseInt(nextValue, 10);
      index += 1;
    } else if (current === '--config' && nextValue) {
      options.config = nextValue;
      index += 1;
    }
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const packageJson = readJsonFile(resolveFromRepo('package.json'));
  const { config } = loadStoreConfig(options.config);
  const releaseContext = buildReleaseContext({
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    track: options.track,
    platform: options.platform,
    buildNumber: options.buildNumber,
    config,
  });

  const generatedDir = resolveFromRepo(releaseContext.release.generatedDir);
  ensureDir(generatedDir);

  writeJsonFile(resolve(generatedDir, 'release-context.json'), releaseContext);

  for (const currentPlatform of getRequestedPlatforms(config, options.platform)) {
    const platformConfig = config.platforms?.[currentPlatform] ?? {};
    const wrapperDir = platformConfig.wrapperDir ?? `store/${currentPlatform}`;
    const wrapperAvailable = wrapperExists(wrapperDir);

    writeJsonFile(resolve(generatedDir, `${currentPlatform}-release.json`), {
      ...releaseContext,
      release: {
        ...releaseContext.release,
        platform: currentPlatform,
      },
      wrapper: {
        dir: wrapperDir,
        exists: wrapperAvailable,
        enabled: Boolean(platformConfig.enabled),
      },
    });

  }

  const requestedPlatforms = getRequestedPlatforms(config, options.platform);
  console.log(`Store release context generated in ${releaseContext.release.generatedDir}`);
  console.log(`Track: ${releaseContext.release.track}`);
  console.log(`Platforms: ${requestedPlatforms.join(', ')}`);
}

main();
