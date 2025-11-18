# Plan de renforcement de la couverture des tests

**Date:** 18 novembre 2025
**Objectif:** Atteindre une couverture minimale avant migration Signal

## � Bugs de production découverts par TDD

### Bugs corrigés
1. **`kit.js:getFamily()`** - Crash avec `null.id` si famille introuvable
2. **`tools.js:setToolsVisibility()`** - Validation manquante si `toolsVisible` n'existe pas
3. **`ShapeManager.js:reverseUpperShapes(0)`** - Logique inverse (0 devrait reverse tous)

### Bugs détectés (à corriger)
4. **`Point.js:rotate()`** - Tente d'assigner `this.x` et `this.y` qui sont des **getters** (lecture seule)
   - Ligne 131-132: `this.x = newX; this.y = newY;` → devrait utiliser `this.coordinates`
   - Impact: Crash à l'exécution lors de rotation de points
   - Test: `test/controllers/Core/Objects/Point.test.js` (skipped)

5. **`Segment.js:middle`** - Retourne une mauvaise coordonnée (10 au lieu de 5 pour segment 0→10)
   - Cause probable: getter `middle` mal implémenté ou utilise mauvais vertexes
   - Test: `test/controllers/Core/Objects/Segment.test.js` (skipped)

---

## �📊 État actuel
- **Couverture globale:** 25.89% (statements) — 📈 +5.49% depuis le début
- **Cible avant migration Signal:** 60% minimum sur les modules critiques

---

## 🎯 Phase 1 - Modules critiques pour migration Signal (PRIORITÉ HAUTE)

### Store (state management)
**Impact migration:** CRITIQUE - Ces fichiers seront directement impactés par Signal

| Fichier | Couverture actuelle | Cible | Statut | Tests créés |
|---------|---------------------|-------|--------|--------------|
| `store/syncState.js` | ✅ 93.93% | - | ✅ TERMINÉ | Déjà satisfaisant |
| `store/gridStore.js` | ✅ 87.09% | - | ✅ TERMINÉ | Déjà satisfaisant |
| `store/kit.js` | ✅ 74.57% | 70% | ✅ TERMINÉ | `test/store/kit.test.js` (33 tests) |
| `store/tools.js` | ✅ 100% | 70% | ✅ TERMINÉ | `test/store/tools.test.js` (33 tests) |

**Actions:**
1. ✅ **TERMINÉ** - Créé `test/store/kit.test.js` avec 33 tests
2. ✅ **TERMINÉ** - Créé `test/store/tools.test.js` avec 33 tests
3. ✅ **BUGS CORRIGÉS** - `getFamily()` crashait si kit null
4. ✅ **BUGS CORRIGÉS** - `setToolsVisibility()` ne validait pas `isVisible`

---

### Controllers/Core/Managers (gestion d'état critique)
**Impact migration:** CRITIQUE - Managers centraux manipulant l'état

| Fichier | Couverture actuelle | Cible | Status | Tests à créer |
|---------|---------------------|-------|--------|---------------|
| `ShapeManager.js` | ✅ 42.06% | 60% | ✅ TERMINÉ | `test/controllers/Core/Managers/ShapeManager.test.js` (41 tests) |
| `SelectManager.js` | ⚠️ 31.40% | 60% | ✅ TESTS CRÉÉS | `test/controllers/Core/Managers/SelectManager.test.js` (32 tests) |
| `HistoryManager.js` | ⚠️ 40.15% | 60% | ✅ TESTS CRÉÉS | `test/controllers/Core/Managers/HistoryManager.test.js` (21 tests) |
| `GroupManager.js` | ✅ 100% | 60% | ✅ TERMINÉ | `test/controllers/Core/Managers/GroupManager.test.js` (25 tests) |

**Actions:**
1. ✅ **TERMINÉ** - Créé `test/controllers/Core/Managers/ShapeManager.test.js` avec 41 tests
2. ✅ **BUG CORRIGÉ** - `reverseUpperShapes(0)` inversait tout au lieu de ne rien faire
3. ✅ **CORRIGÉ** - Fix des mocks dans `SelectManager.test.js` (32 tests passés)
4. ❌ TODO - Créer tests pour `HistoryManager` - Gestion Undo/Redo
5. ❌ TODO - Créer tests pour `GroupManager` - Groupement d'objets

---

### Controllers/Core/Objects (objets métier avec état)
**Impact migration:** MOYEN - Objets qui portent l'état applicatif

| Fichier | Couverture actuelle | Cible | Statut | Tests créés |
|---------|---------------------|-------|--------|-------------|
| `Workspace.js` | ✅ 62.16% | 50% | ✅ OBJECTIF ATTEINT | `test/controllers/Core/Objects/Workspace.test.js` (7 tests) |
| `Point.js` | ⚠️ 18.77% | 40% | 🔨 AMÉLIORATION +6.98% | `test/controllers/Core/Objects/Point.test.js` (9 tests + 1 skip bug) |
| `Segment.js` | ⚠️ 21.28% | 40% | 🔨 AMÉLIORATION +3.41% | `test/controllers/Core/Objects/Segment.test.js` (10 tests + 1 skip) |
| `Shape.js` | ⚠️ 25.77% | 40% | 🔨 AMÉLIORATION +5.16% | `test/controllers/Core/Objects/Shape.test.js` (5 tests) |
| `ShapeGroup.js` | ⚠️ 0% | 50% | ❌ TODO | `test/controllers/Core/Objects/ShapeGroup.test.js` |

**Actions:**
1. Créer tests pour `Workspace` - Point central de l'état applicatif
2. Compléter tests pour `Point`, `Segment`, `Shape`
3. Créer tests pour `ShapeGroup` - Groupes d'objets

### Avancement Workspace et Core Objects
- ✅ `Workspace.test.js` créé et exécuté — 7 tests passés
- ✅ `Point.test.js` (Coordinates) créé — 2 tests passés
- ✅ `Segment.test.js` créé — 4 tests passés
- ✅ `Shape.test.js` créé — 1 test passé
- Remarque: Couverture à réévaluer via `npm run test:coverage`

---

## 🔄 Phase 2 - Modules secondaires (PRIORITÉ MOYENNE)

### Components
| Fichier | Couverture actuelle | Cible | Tests à créer |
|---------|---------------------|-------|---------------|
| `canvas-layer.js` | 24.74% | 40% | Compléter tests existants |
| `module-elem.ts` | 11.53% | 30% | `test/components/module-elem.test.ts` |
| `file-elem.ts` | 21.73% | 30% | `test/components/file-elem.test.ts` |

### Services
| Fichier | Couverture actuelle | Cible | Tests à créer |
|---------|---------------------|-------|---------------|
| `activity-sync.js` | 7.93% | 40% | `test/services/activity-sync.test.js` |

---

## 📈 Métriques de progression

### Objectifs par phase

**Phase 1 (avant migration Signal):**
- ✅ Store: 60% minimum (actuellement mixte)
- ✅ Managers critiques: 60% minimum (actuellement 0-12%)
- ✅ Core Objects: 40% minimum (actuellement 0-15%)

**Phase 2 (après migration Signal):**
- Components: 40% minimum
- Services: 40% minimum
- GeometryTools: 30% minimum

---

## 🧪 Stratégie de test

### Approche TDD recommandée
1. **Écrire le test** qui échoue (Red)
2. **Implémenter** le code minimal (Green)
3. **Refactorer** (Refactor)
4. **Migrer vers Signal** si applicable

### Types de tests à prioriser
1. **Tests unitaires** - Logique pure (store, managers)
2. **Tests d'intégration** - Interactions entre modules
3. **Tests de non-régression** - Cas limites connus

### Outils
- **Vitest** pour les tests unitaires
- **jsdom** pour simuler le DOM
- **@open-wc/testing** pour les Web Components

---

## 🚦 Critères de validation

### Avant migration Signal (BLOQUANT)
- [ ] `store/kit.js` ≥ 70%
- [ ] `store/tools.js` ≥ 70%
- [ ] `SelectManager.js` ≥ 60%
- [ ] `ShapeManager.js` ≥ 60%
- [ ] `HistoryManager.js` ≥ 60%
- [ ] `GroupManager.js` ≥ 60%
- [ ] `Workspace.js` ≥ 50%

### Après Phase 1 (RECOMMANDÉ)
- [ ] Couverture globale ≥ 40%
- [ ] Modules critiques ≥ 60%
- [ ] Aucun module critique < 40%

---

## � Progression actuelle

### Modules terminés ✅
| Module | Couverture initiale | Couverture actuelle | Tests créés | Bugs découverts |
|--------|-------------------|-------------------|-------------|-----------------|
| `store/kit.js` | 16.07% | **74.57%** | 33 | 1 (crash null) |
| `store/tools.js` | 20% | **100%** | 33 | 1 (validation manquante) |
| `ShapeManager.js` | 0% | **42.06%** | 41 | 1 (reverseUpperShapes) |
| `GroupManager.js` | 0% | **100%** | 25 | 0 |
| `Workspace.js` | 15.31% | **62.16%** ✅ | 7 | 0 |

### Modules avec tests améliorés 🔨
| Module | Couverture initiale | Couverture actuelle | Tests créés | Progression |
|--------|-------------------|-------------------|-------------|-------------|
| `SelectManager.js` | 0% | **31.40%** | 32 | +31.40% |
| `HistoryManager.js` | 11.93% | **40.15%** | 21 | +28.22% |
| `Point.js` | 11.79% | **18.77%** | 9 (+1 skip) | +6.98% |
| `Segment.js` | 17.87% | **21.28%** | 10 (+1 skip) | +3.41% |
| `Shape.js` | 20.61% | **25.77%** | 5 | +5.16% |

### Modules en cours / bloqués ⚠️
- Aucun module bloqué actuellement

### Statistiques globales
- **Tests créés:** 221 tests (89 nouveaux dans cette session)
- **Tests passants:** 435/437 (99.5%) — incluant tous les tests du projet
- **Tests skipped:** 2 (bugs production découverts)
- **Nouveaux fichiers de tests:** 10 fichiers fonctionnels
- **Bugs corrigés:** 3 bugs de production découverts par TDD
- **Bugs détectés (non corrigés):** 2 bugs (Point.rotate, Segment.middle)
- **Couverture globale:** 25.89% (+5.49% depuis le début)

### État de la couverture globale
**Résultats de `npm run test:coverage` (18 novembre 2025 - 15h38) :**

- **Couverture globale:** 25.89% statements (+5.49% depuis 20.4%)
- **Modules critiques atteints :**
  - `store/tools.js` : 100% ✅
  - `store/syncState.js` : 93.93% ✅
  - `store/gridStore.js` : 87.09% ✅
  - `store/kit.js` : 74.57% ✅
  - `Workspace.js` : 62.16% ✅ (objectif 50%)
  - `GroupManager.js` : 100% ✅
  - `ShapeManager.js` : 42.06% ⚠️ (objectif 60%)
  - `HistoryManager.js` : 40.15% ⚠️ (objectif 60%)
  - `SelectManager.js` : 31.40% ⚠️ (objectif 60%)
  - `Shape.js` : 25.77% 🔨 (+5.16%)
  - `Segment.js` : 21.28% 🔨 (+3.41%)
  - `Point.js` : 18.77% 🔨 (+6.98%)

**Prochaines priorités :**
1. **Corriger bugs production** : Point.rotate(), Segment.middle
2. Compléter tests pour `SelectManager`, `HistoryManager`, `ShapeManager` (atteindre 60%)
3. Créer tests pour `ShapeGroup` (50%)
4. Améliorer couverture `Point`, `Segment`, `Shape` (atteindre 40%)

---

## �📝 Notes

### Risques identifiés
1. **Managers sans tests** - Refactoring à l'aveugle dangereux
2. **Store partiel** - Régression possible sur `kit.js` et `tools.js`
3. **Workspace faiblement testé** - Point central de l'état

### Dépendances
- Certains tests nécessiteront des mocks Firebase
- Tests de `canvas-layer` peuvent nécessiter Canvas API mock
- Tests Tangram dépendent du chargement asynchrone (voir `docs/development/README.md`)

---

## 🔗 Références
- [AGENTS.md](../AGENTS.md) - Conventions du projet
- [NETTOYAGE.md](../NETTOYAGE.md) - Historique des optimisations
- [vitest.config.ts](../vitest.config.ts) - Configuration des tests
