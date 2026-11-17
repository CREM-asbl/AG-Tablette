# Guide de contribution - AG-Tablette

Merci de votre intérêt pour contribuer au projet AG-Tablette ! Ce guide vous aidera à contribuer efficacement.

## 📋 Prérequis

- Node.js 18+ et pnpm
- Git
- Un éditeur de code (VS Code recommandé)
- Connaissance de TypeScript/JavaScript, Lit Elements et Astro

## 🚀 Configuration de l'environnement

1. **Cloner le repository**
   ```bash
   git clone https://github.com/CREM-asbl/AG-Tablette.git
   cd AG-Tablette
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Lancer l'environnement de développement**
   ```bash
   pnpm run dev
   ```

4. **Lancer les émulateurs Firebase (optionnel)**
   ```bash
   pnpm run start-emulators
   ```

## 🏗️ Architecture du projet

Consultez `AGENTS.md` pour une documentation complète de l'architecture. Points clés :

### Structure des dossiers
```
src/
├── components/     # Web Components Lit réutilisables
├── controllers/    # Logique métier (1 outil = 1 controller)
├── core/          # Systèmes centraux (Performance, Validation)
├── services/      # Services Firebase et utilitaires
├── store/         # Gestion d'état avec signaux Lit
└── utils/         # Fonctions utilitaires pures
```

### Pattern Controller
- **1 outil géométrique = 1 controller dédié**
- Structure : `controllers/[NomOutil]/index.js`
- Responsabilité unique par controller

## 📝 Conventions de code

### Style
- **Langue** : Français pour les noms de classes/méthodes métier
- **Format** : Suivre ESLint et Prettier
- **Comparaisons** : Toujours utiliser `===` et `!==` (règle stricte)
- **Variables** : Préférer `const`, utiliser `let` uniquement si réaffectation

### Naming
```javascript
// ✅ Bon
class CreateCircleTool extends Tool {}
const tangramManager = new TangramManager();

// ❌ Éviter
class CCT extends Tool {}
const tM = new TM();
```

### Console & Debug
- **Production** : Aucun `console.log` (supprimer avant commit)
- **Développement** : `console.log` autorisés temporairement
- **Erreurs** : `console.error()` et `console.warn()` toujours autorisés
- **Conditional logging** : Utiliser `import.meta.env.DEV`

```javascript
// ✅ Bon
if (import.meta.env.DEV) {
  console.log('Debug info');
}

// ❌ Éviter en production
console.log('Debug info');
```

## 🧪 Tests (TDD recommandé)

### Méthodologie TDD
**Avant toute modification ou correction :**
1. Écrire un test qui échoue
2. Corriger le code pour que le test passe
3. Refactorer si nécessaire

### Commandes de test
```bash
# Tests unitaires
pnpm test                 # Exécuter une fois
pnpm run test:watch       # Mode watch
pnpm run test:coverage    # Avec couverture

# Tests E2E
pnpm run test:playwright

# Tous les tests
pnpm run test:all
```

### Couverture minimale
- **Objectif** : 80% de couverture
- **Requis** : Tests pour toute nouvelle fonctionnalité
- **Critiques** : 100% pour les controllers de géométrie

## 🔍 Qualité du code

### Avant de commiter
```bash
# Linter
pnpm run lint
pnpm run lint:fix

# Tests
pnpm run test:all

# Build (vérifier qu'il n'y a pas d'erreurs)
pnpm run build
```

### Règles ESLint strictes
- `eqeqeq: 'error'` - Comparaisons strictes obligatoires
- `no-unused-vars: 'warn'` - Variables inutilisées (préfixer par `_` si intentionnel)
- `prefer-const: 'warn'` - Préférer const
- `no-console: 'off'` - Console autorisé (à nettoyer manuellement)

## 🔀 Workflow Git

### Branches
- `master` - Production (protégée)
- `dev` - Développement principal
- `feature/nom-fonctionnalite` - Nouvelles fonctionnalités
- `fix/nom-bug` - Corrections de bugs
- `refactor/nom-refactor` - Refactoring

### Commits
Format : `type(scope): description`

Types :
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `refactor` - Refactoring
- `test` - Ajout/modification de tests
- `docs` - Documentation
- `chore` - Maintenance (deps, config)

Exemples :
```
feat(tangram): ajouter vérification de solution automatique
fix(rotation): corriger le calcul d'angle négatif
refactor(core): simplifier ValidationSystem
test(create): ajouter tests pour CreateCircle
docs(readme): mettre à jour les instructions d'installation
```

### Pull Requests
1. Créer une branche depuis `dev`
2. Faire vos modifications
3. Écrire/mettre à jour les tests
4. Vérifier que `pnpm run test:all` passe
5. Vérifier que `pnpm run lint` ne donne pas d'erreurs
6. Créer la PR vers `dev` avec description claire

**Template de PR :**
```markdown
## Description
[Description claire de la modification]

## Type de changement
- [ ] Nouvelle fonctionnalité
- [ ] Correction de bug
- [ ] Refactoring
- [ ] Documentation

## Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests E2E ajoutés/mis à jour (si nécessaire)
- [ ] Tous les tests passent

## Checklist
- [ ] Code linté sans erreur
- [ ] Build réussit
- [ ] Documentation mise à jour
- [ ] Pas de console.log en production
```

## 🎯 Pour les nouveaux outils géométriques

1. **Créer le dossier** : `controllers/[NomOutil]/`
2. **Hériter de la classe de base** : `Tool` ou `BaseGeometryTool`
3. **Pattern Observer** : Utiliser événements pour communication
4. **Ajouter tests** : Minimum 80% de couverture
5. **Documenter** : JSDoc + mise à jour de `AGENTS.md` si architecture impactée

Exemple minimal :
```javascript
// controllers/MonOutil/index.js
import { BaseGeometryTool } from '../Core/States/BaseGeometryTool.js';

export class MonOutilTool extends BaseGeometryTool {
  constructor() {
    super('MonOutil', 'Description de mon outil');
  }

  start() {
    // Initialisation
  }

  executeAction(action) {
    // Logique métier
  }

  end() {
    // Nettoyage
  }
}
```

## 📚 Ressources

- [AGENTS.md](./AGENTS.md) - Mémoire du projet et architecture
- [docs/](./docs/) - Documentation technique détaillée
- [Lit Elements Guide](https://lit.dev/)
- [Astro Documentation](https://docs.astro.build/)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)

## ❓ Questions ?

- Consulter d'abord `AGENTS.md` et la documentation `docs/`
- Ouvrir une issue GitHub pour les questions techniques
- Contacter l'équipe CREM-asbl

## 📜 Licence

Voir le fichier LICENSE à la racine du projet.

---

**Merci de contribuer à AG-Tablette !** 🎉
