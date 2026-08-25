import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const SUPPORTED_PLATFORMS = ['android', 'windows'];
export const SUPPORTED_TRACKS = ['internal', 'beta', 'production'];

export function normalizePlatform(platform = 'all') {
  if (platform === 'all') return 'all';
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    throw new Error(`Unsupported platform "${platform}". Expected one of: all, ${SUPPORTED_PLATFORMS.join(', ')}`);
  }
  return platform;
}

export function normalizeTrack(track = 'internal') {
  if (!SUPPORTED_TRACKS.includes(track)) {
    throw new Error(`Unsupported track "${track}". Expected one of: ${SUPPORTED_TRACKS.join(', ')}`);
  }
  return track;
}

export function normalizeVersionInfo(rawVersion, buildNumber = 0) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(rawVersion);
  if (!match) {
    throw new Error(`Unable to extract semver from package version "${rawVersion}"`);
  }

  const [, majorText, minorText, patchText] = match;
  const major = Number.parseInt(majorText, 10);
  const minor = Number.parseInt(minorText, 10);
  const patch = Number.parseInt(patchText, 10);

  return {
    raw: rawVersion,
    semver: `${major}.${minor}.${patch}`,
    major,
    minor,
    patch,
    buildNumber,
    androidVersionCode: major * 10000 + minor * 100 + patch,
    windowsVersion: `${major}.${minor}.${patch}.${buildNumber}`,
  };
}

export function isPlatformSelected(selectedPlatform, candidatePlatform) {
  return selectedPlatform === 'all' || selectedPlatform === candidatePlatform;
}

export function buildReleaseContext({
  packageName,
  packageVersion,
  track = 'internal',
  platform = 'all',
  buildNumber = 0,
  config,
}) {
  const normalizedTrack = normalizeTrack(track);
  const normalizedPlatform = normalizePlatform(platform);
  const version = normalizeVersionInfo(packageVersion, buildNumber);
  const generatedDir = config?.release?.generatedDir ?? 'store/generated';

  return {
    generatedAt: new Date().toISOString(),
    packageName,
    app: {
      playPackageId: config?.app?.playPackageId ?? '',
      windowsProductId: config?.app?.windowsProductId ?? '',
    },
    release: {
      track: normalizedTrack,
      platform: normalizedPlatform,
      buildNumber,
      generatedDir,
    },
    version,
    platforms: Object.fromEntries(
      SUPPORTED_PLATFORMS.map((currentPlatform) => {
        const platformConfig = config?.platforms?.[currentPlatform] ?? {};
        return [
          currentPlatform,
          {
            enabled: Boolean(platformConfig.enabled),
            wrapperDir: platformConfig.wrapperDir ?? `store/${currentPlatform}`,
            artifactGlobs: platformConfig.artifactGlobs ?? [],
          },
        ];
      }),
    ),
  };
}

export function getRequestedPlatforms(config, platform = 'all', { enabledOnly = false } = {}) {
  const normalizedPlatform = normalizePlatform(platform);

  return SUPPORTED_PLATFORMS.filter((candidatePlatform) => {
    if (!isPlatformSelected(normalizedPlatform, candidatePlatform)) {
      return false;
    }

    if (!enabledOnly) {
      return true;
    }

    return Boolean(config?.platforms?.[candidatePlatform]?.enabled);
  });
}

export function getStageCommands({ config, platform = 'all', stage }) {
  const commandKey = stage === 'prepare' ? 'prepareCommand' : 'publishCommand';

  return getRequestedPlatforms(config, platform, { enabledOnly: true })
    .map((currentPlatform) => {
      const platformConfig = config.platforms?.[currentPlatform] ?? {};
      const command = platformConfig[commandKey];
      if (!command) {
        return null;
      }

      return {
        platform: currentPlatform,
        command,
        cwd: platformConfig.wrapperDir ?? `store/${currentPlatform}`,
      };
    })
    .filter(Boolean);
}

export function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

export function writeJsonFile(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function resolveFromRepo(relativePath) {
  return resolve(process.cwd(), relativePath);
}

export function loadStoreConfig(configPath = 'store/store.config.json') {
  const absoluteConfigPath = resolveFromRepo(configPath);
  return {
    path: absoluteConfigPath,
    config: readJsonFile(absoluteConfigPath),
  };
}

export function wrapperExists(wrapperDir) {
  return existsSync(resolveFromRepo(wrapperDir));
}
