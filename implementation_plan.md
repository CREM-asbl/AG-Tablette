# Plan de Priorisation - Migration Signal

## Composants Analysés

### ✅ Déjà Migrés
1. **ag-main.ts** - Layout principal
2. **ag-menu.ts** - Menu latéral
3. **canvas-container.ts** - Conteneur canvas

### 🎯 Composants Prioritaires

#### **Priorité 1 : ag-app.ts** (Root Component)
**Fichier** : `src/components/ag-app.ts`

**Props actuelles** :
- `@property() appLoading` - État de chargement global
- `@property() environnement_selected` - Environnement sélectionné

**Signaux disponibles** :
- `appLoading` → utilisable
- `currentEnvironment` → peut remplacer `environnement_selected`

**Impact** : **TRÈS ÉLEVÉ**
- Composant racine de l'application
- Gère le routing entre écran de sélection environnement et application principale
- Simplifiera la logique de démarrage

**Complexité** : **FAIBLE**
- Seulement 2 props à migrer
- Logique simple dans `setState()`

**Recommandation** : **MIGRER EN PRIORITÉ** ✅

---

#### **Priorité 2 : shape-selector.ts** (Dynamic UI)
**Fichier** : `src/components/shape-selector.ts`

**Props actuelles** :
- `@property() family` - Famille de formes
- `@property() type` - Type de création
- `@property() templatesNames` - Liste des modèles
- `@property() selectedTemplate` - Modèle sélectionné
- `@property() nextStep` - Prochaine étape de l'outil

**Signaux potentiels** :
- `activeTool` → déjà disponible
- `selectedTemplate` → peut être ajouté à `appState.js`

**Impact** : **MOYEN**
- Popup dynamique pour sélection de formes
- Utilisé fréquemment lors de la création

**Complexité** : **MOYENNE**
- 6 props dont certaines sont passées dynamiquement
- Logique de fermeture basée sur `tool-updated`

**Recommandation** : **MIGRER APRÈS ag-app**

---

#### **Priorité 3 : sync-status-indicator.ts**
**Fichier** : `src/components/sync-status-indicator.ts`

**État actuel** : ✅ **DÉJÀ UTILISE DES SIGNALS !**
- Utilise `syncState.js` avec des signaux custom
- Utilise `OptimizedSignalController`

**Recommandation** : **PAS DE MIGRATION NÉCESSAIRE** - Déjà moderne

---

### 📦 Composants de Faible Priorité (Popups)

Ces composants sont des **popups éphémères** avec un **état local** :

1. **open-server-popup.ts** - 8 props (state interne de popup)
2. **sync-settings-popup.ts** - 7 props (state interne de popup)
3. **theme-elem.ts** - 5 props (élément de liste)
4. **module-elem.ts** - 4 props (élément de liste)
5. **file-elem.ts** - 2 props (élément de liste)

**Recommandation** : **PAS DE MIGRATION** pour l'instant
- État local approprié pour des popups
- Peu d'interaction avec l'état global
- Migration apporterait peu de valeur

---

### 🛠️ Autres Composants

#### **color-button.ts, flex-grid.ts**
- Composants utilitaires sans état global
- **PAS DE MIGRATION NÉCESSAIRE**

---

## Ordre de Migration Recommandé

### Phase 3 (Immédiate)
1. ✅ **ag-app.ts** - Impact majeur, complexité faible

### Phase 4 (Court terme)
2. **shape-selector.ts** - Améliorer l'expérience de sélection de formes

### Phase 5 (Long terme - optionnel)
3. Popups (seulement si besoin d'état partagé entre eux émerge)

---

## Bénéfices Attendus

### Migration de ag-app.ts
- ✅ Synchronisation automatique avec l'état de l'app
- ✅ Suppression du listener `state-changed` manuel
- ✅ Code plus déclaratif et réactif

### Migration de shape-selector.ts
- ✅ Meilleure synchronisation avec l'outil actif
- ✅ Moins de props à passer dynamiquement
- ✅ Réactivité améliorée

---

## Prochaine Étape

**Recommandation** : Commencer par **ag-app.ts** car :
1. Impact architectural majeur (composant racine)
2. Complexité faible (seulement 2 props)
3. Démontre la valeur des Signals au niveau le plus haut de l'app
