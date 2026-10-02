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
  const args = new Set(process.argv.slice(2));
  if (args.has('--help') || args.has('-h')) {
    console.log('Usage: node scripts/bump-version.mjs [--check|--dry-run]');
    return;
  }
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const next = bumpPatch(pkg.version);
  if (args.has('--check') || args.has('--dry-run')) {
    console.log(`would bump: ${pkg.version} -> ${next}`);
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
