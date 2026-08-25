# AG-Tablette

Apprenti Géomètre - Application web éducative pour géométrie interactive sur tablettes.

## 🚀 Installation

```bash
npm install
```

## 💻 Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Démarrer les émulateurs Firebase
npm run start-emulators
```

## 🏗️ Build & Déploiement

```bash
# Créer le build de production
npm run build

# Préparer une release stores (sans publier)
pnpm run store:release -- --platform all --track internal --build-number 1

# Déployer sur Firebase
npm run deploy

# Déployer sur le canal beta
npm run deploy:beta3
```

## 🧪 Tests

```bash
# Tests unitaires (Vitest)
npm test
npm run test:watch
npm run test:coverage

# Tests E2E (Playwright)
npm run test:playwright

# Tous les tests
npm run test:all
```

## 🔍 Qualité du code

```bash
# Linter
npm run lint
npm run lint:fix
```

## 📚 Stack technique

- **Framework** : Astro 5.x + Lit Elements (Web Components)
- **Backend** : Firebase (Auth, Firestore, Storage, Functions)
- **Testing** : Vitest (unit) + Playwright (E2E)
- **Build** : Vite (via Astro)
- **Langue** : TypeScript/JavaScript

## 📖 Documentation

Consultez le fichier `AGENTS.md` pour la documentation complète de l'architecture et des conventions du projet.

Le dossier `docs/` contient la documentation technique détaillée.

Le dossier `store/` contient l'infrastructure de publication Play Store / Microsoft Store.