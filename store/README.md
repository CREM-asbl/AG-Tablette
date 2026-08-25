# Store release

Cette arborescence contient l'infrastructure versionnee pour les publications Play Store et Microsoft Store.

## Structure

```text
store/
├── android/            # wrapper Android versionne
├── windows/            # wrapper Windows versionne
├── generated/          # artefacts temporaires generes par les scripts
└── store.config.json   # config commune des releases stores
```

## Commandes

```bash
pnpm run store:release:prepare -- --platform android --track internal --build-number 42
pnpm run store:release:publish -- --platform android
```

## Variables d'environnement injectees pendant la publication

- `AG_STORE_PLATFORM`
- `AG_STORE_TRACK`
- `AG_STORE_CONTEXT_PATH`
- `AG_STORE_VERSION_RAW`
- `AG_STORE_VERSION_SEMVER`
- `AG_STORE_ANDROID_VERSION_CODE`
- `AG_STORE_WINDOWS_VERSION`
- `AG_PLAY_PACKAGE_ID`
- `AG_WINDOWS_PRODUCT_ID`

## Activation

1. importer le vrai wrapper dans `store/android` ou `store/windows`
2. renseigner `prepareCommand` et `publishCommand` dans `store.config.json`
3. passer `enabled` a `true`
4. configurer les secrets GitHub utilises par les wrappers
