# Versionnage automatique (CI)

## Principe
- `package.json` est la source de vérité.
- Chaque push sur `master` qui passe `lint`, `unit-tests`, `build`, `e2e` déclenche `deploy-production`, qui incrémente le patch (`1.5.2` → `1.5.3`) **avant** le déploiement Firebase.
- Le commit de bump (`chore(release): bump version to X.Y.Z [skip ci]`) + tag `vX.Y.Z` est poussé automatiquement ; `[skip ci]` évite toute boucle CI.

## Fichiers synchronisés
- `package.json` → `version`
- `android/twa/twa-manifest.json` → `appVersionName`, `appVersion`, `appVersionCode` (monotone : `major*10000 + minor*100 + patch`, jamais décroissant)
- Le `manifest.json` PWA est généré au build depuis `package.json` (`astro.config.mjs`), donc déjà à jour au déploiement.

## Usage local
```bash
node scripts/bump-version.mjs   # ou : pnpm version:bump
```

## Tests
```bash
pnpm vitest run test/scripts/bump-version.test.js
```
