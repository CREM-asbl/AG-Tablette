import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = resolve(rootDir, 'package.json');
const twaManifestPath = resolve(rootDir, 'android/twa/twa-manifest.json');

export function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) throw new Error(`Version invalide: "${version}" (attendu: X.Y.Z)`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function bumpPatch(version) {
  const { major, minor, patch } = parseVersion(version);
  return `${major}.${minor}.${patch + 1}`;
}

export function bumpMinor(version) {
  const { major, minor } = parseVersion(version);
  return `${major}.${minor + 1}.0`;
}

export function bumpMajor(version) {
  const { major } = parseVersion(version);
  return `${major + 1}.0.0`;
}

export function bumpVersion(version, type = 'patch') {
  switch (type) {
    case 'major': return bumpMajor(version);
    case 'minor': return bumpMinor(version);
    case 'patch':
    default: return bumpPatch(version);
  }
}

export function versionCodeFor(version, currentCode = 0) {
  const { major, minor, patch } = parseVersion(version);
  const computed = major * 10000 + minor * 100 + patch;
  return Math.max(computed, Number(currentCode || 0) + 1);
}

function syncTwaManifest(version) {
  const manifest = JSON.parse(readFileSync(twaManifestPath, 'utf-8'));
  manifest.appVersionName = version;
  manifest.appVersion = version;
  manifest.appVersionCode = versionCodeFor(version, manifest.appVersionCode);
  writeFileSync(twaManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest.appVersionCode;
}

function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find(a => a.startsWith('--type='));
  const type = typeArg ? typeArg.split('=')[1] : 'patch';
  const validTypes = ['patch', 'minor', 'major'];
  if (!validTypes.includes(type)) {
    console.error(`Type invalide: ${type}. Attendu: patch, minor, major`);
    process.exit(1);
  }
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/bump-version.mjs [--type=patch|minor|major] [--check|--dry-run]');
    return;
  }
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const next = bumpVersion(pkg.version, type);
  if (args.includes('--check') || args.includes('--dry-run')) {
    console.log(`would bump (${type}): ${pkg.version} -> ${next}`);
    return;
  }
  pkg.version = next;
  writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  const versionCode = syncTwaManifest(next);
  console.log(`version: ${next} (versionCode: ${versionCode})`);
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (invokedDirectly) main();
