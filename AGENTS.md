# 🤖 AGENTS.md - Mémoire inter-session pour IA

> **Objectif** : Économiser les requêtes IA, éviter les régressions, maintenir la cohérence architecturale et respecter les conventions du projet AG-Tablette.

## 📋 Informations du projet

### Architecture générale
- **Type** : Application web éducative pour géométrie interactive sur tablettes
- **Framework principal** : Astro 5.x + Lit Elements (Web Components)
- **Pattern architectural** : Component-based avec système de controllers modulaires
- **Build system** : Vite (via Astro)
- **État** : Production active (CREM-asbl)

### Stack technique
```
Frontend: Astro + Lit Elements + TypeScript/JavaScript
Backend: Firebase (Auth, Firestore, Storage, Functions)
Testing: Vitest (unit) + Playwright (E2E)
Outils: ESLint, Prettier, Service Worker
```

## 🏗️ Structure architecturale

### Organisation des dossiers
```
src/
├── components/     # Web Components Lit réutilisables
├── controllers/    # Logique métier modulaire (1 outil = 1 controller)
├── core/          # Systèmes centraux (Performance, Validation)
├── services/      # Services Firebase et utilitaires
├── store/         # Gestion d'état
└── utils/         # Fonctions utilitaires pures
```

### Pattern Controller
- **Principe** : 1 outil géométrique = 1 controller dédié
- **Structure** : `controllers/[NomOutil]/index.js`
- **Exemples** : `CreateCircle/`, `Rotate/`, `Tangram/`
- **Responsabilité unique** : Chaque controller gère un aspect spécifique

## 🎯 Conventions de développement

### Code Style
- **Langue** : Français pour les noms de classes/méthodes métier
- **Format** : Lit Elements pour les composants, classes ES6 pour la logique
- **Imports** : Chemins absolus configurés dans `jsconfig.json`
- **Debug** : `console.log` autorisés en développement, supprimer avant production
- **Performance** : Logs conditionnés avec `import.meta.env.DEV` (monitoring système)

### Naming Conventions
```javascript
// ✅ Bon
class CreateCircleTool extends Tool {}
const tangramManager = new TangramManager();

// ❌ Éviter
class CCT extends Tool {}
const tM = new TM();
```

### Gestion des erreurs
- **Production** : Aucun `console.log` (supprimer avant commit)
- **Développement** : `console.log` autorisés pour debug
- **Erreurs** : `console.error()` et `console.warn()` toujours autorisés
- **Validation** : Utiliser `ValidationSystem.js`

## 🔧 Systèmes centraux

### PerformanceSystem.js
- **Rôle** : Monitoring des performances, métriques
- **Usage** : Tracker les opérations coûteuses
- **Convention** : Wrapper les opérations lourdes

### ValidationSystem.js
- **Rôle** : Validation des données et états
- **Usage** : Valider avant traitement
- **Pattern** : Fail-fast avec messages explicites

### Canvas Architecture
- **Layers** : Système multi-couches pour rendu
- **Pattern Observer** : Événements custom pour communication
- **Async loading** : Gestion asynchrone des ressources lourdes

## 🎮 Spécificités métier

### Système Tangram
- **Problème connu** : Chargement asynchrone des silhouettes
- **Solution** : Événement 'tangram-canvas-ready' + timeout de sécurité
- **Fichiers clés** : `Workspace.js`, `canvas-layer.js`, `SolutionCheckerTool.js`

### Gestion d'état
- **Pattern** : État centralisé avec propagation par événements
- **Workspace** : Point central pour la persistance
- **BackObjects** : Objets de fond (silhouettes) traités séparément

### Firebase Integration
- **Config** : `firebase-config.json` + `firebase-init.js`
- **Services** : Auth, Firestore, Storage
- **Pattern** : Services isolés dans `src/services/`

## ⚠️ Points d'attention critiques

### Performance
- **Bundle size** : Chunk principal ~681KB (optimisable)
- **Lazy loading** : Utiliser dynamic imports pour les popups
- **Canvas** : Optimiser les reflows et repaints

### Compatibilité
- **Cible** : Tablettes (iOS/Android) + Desktop
- **Browsers** : Modernes (ES6+ requis)
- **Touch** : Gestion tactile native

### Tests
```bash
npm test          # Vitest (unit tests)
npm run test:playwright # E2E tests
npm run test:all  # Suite complète
```

## 🚫 Anti-patterns à éviter

### ❌ À ne pas faire
```javascript
// Import en dur d'un controller dans un autre
import { CreateCircleTool } from '../CreateCircle/index.js';

// État global muté directement
window.appState.tools.current = 'create';

// Console.log en production
console.log('Debug info');

// Logique métier dans les composants
// Séparer UI et logique métier
```

### ✅ À faire
```javascript
// Communication par événements
this.dispatchEvent(new CustomEvent('tool-changed', {detail: 'create'}));

// Debug temporaire (supprimer avant commit)
console.log('Debug info');

// Injection de dépendances
class Tool {
  constructor(workspace, canvas) {
    this.workspace = workspace;
    this.canvas = canvas;
  }
}
```

## 📚 Documentation de référence

### Fichiers essentiels à lire
1. `NETTOYAGE.md` - Historique des optimisations récentes
2. `docs/development/README.md` - Debugging Tangram
3. `package.json` - Scripts et dépendances
4. `src/core/index.js` - Architecture centrale

### Ressources externes
- [Lit Elements Guide](https://lit.dev/)
- [Astro Documentation](https://docs.astro.build/)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)

## 🔄 Historique des décisions importantes

### Dernières modifications majeures
- **Migration dev mode** : Remplacement `window.dev_mode` par `import.meta.env.DEV`
- **Nettoyage console.log** : Suppression massive + nouvelle politique simplifiée
- **Politique logging** : Simplification - logs debug autorisés, suppression manuelle avant prod
- **Fix Tangram** : Résolution du chargement asynchrone des silhouettes
- **Architecture** : Migration vers Astro + maintien des Web Components

### Choix techniques justifiés
- **Lit Elements** : Conservé pour compatibilité et performance
- **Firebase** : Backend managé pour faciliter maintenance
- **Modularité** : Architecture controller pour faciliter les tests

## 🎯 Guidelines pour les futures interventions IA

### Avant toute modification
1. **Lire ce fichier** en priorité
2. **Analyser l'impact** sur l'architecture existante
3. **Respecter les patterns** établis
4. **Tester localement** avec `npm run test:all`

### 🚦 Évolution du state management
> **Note (novembre 2025)** : Pour les futurs développements, la gestion d'état doit progressivement migrer vers un système basé sur **Signal** (state management réactif). Toute nouvelle fonctionnalité ou refactorisation majeure doit privilégier l'usage de Signal pour la gestion d'état, en cohérence avec l'architecture existante et de façon incrémentale.

### Pour les nouveaux outils géométriques
1. Créer un dossier `controllers/[NomOutil]/`
2. Hériter de la classe `Tool` de base
3. Suivre le pattern Observer pour la communication
4. Ajouter les tests correspondants

### Recommandation TDD pour tous les agents IA
> **Bonne pratique** : Avant toute correction de bug ou ajout de fonctionnalité, écrire d'abord un test automatisé qui échoue (TDD). Corriger ensuite le code pour que le test passe, puis refactorer si nécessaire. Cette démarche garantit la non-régression et la robustesse du projet. Tous les agents IA doivent systématiquement appliquer cette méthodologie lors des futures interventions.

### Pour les modifications de performance
1. Utiliser `PerformanceSystem.js`
2. Mesurer avant/après
3. Documenter les métriques

---

## 📝 Métadonnées

**Dernière mise à jour** : Novembre 2025
**Version** : 1.0.0
**Mainteneur** : équipe CREM-asbl
**Contact** : [Informations de contact si nécessaire]

---

> **Note importante** : Ce fichier doit être mis à jour à chaque modification architecturale significative ou décision technique importante. Il constitue la mémoire collective du projet pour les futures sessions IA.