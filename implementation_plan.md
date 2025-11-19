# Plan de Migration : shape-selector.ts

## Analyse

`shape-selector.ts` est un **popup dynamique** qui apparaît lors de la sélection de formes. Il affiche une grille de modèles de formes parmi lesquels l'utilisateur peut choisir.

### Utilisation Actuelle
Le composant est créé **dynamiquement** par les outils de création :
```javascript
const elem = document.createElement('shape-selector');
elem.family = app.tool.selectedFamily;
elem.templatesNames = getFamily(app.tool.selectedFamily).shapeTemplates;
elem.selectedTemplate = app.tool.selectedTemplate;
elem.type = 'Create';
elem.nextStep = 'listen';
document.querySelector('body').appendChild(elem);
```

### Propriétés Actuelles
1. `@property() family` - Nom de la famille de formes (ex: "Carrés")
2. `@property() type` - Type d'outil ('Create', 'CreateLine', etc.)
3. `@property() templatesNames` - Liste des modèles disponibles
4. `@property() titles` - Liste des titres (non utilisée actuellement)
5. `@property() selectedTemplate` - Modèle actuellement sélectionné
6. `@property() nextStep` - Prochaine étape de l'outil

## Décision : Migration Minimale Recommandée

### Option A : Migration Complète (NON RECOMMANDÉE)
- Remplacer toutes les props par des signals
- Créer des signals pour `selectedTemplate`, `nextStep`, etc.
- **Problème** : Ces propriétés sont **locales au contexte** de création
- Polluerait le store global avec de l'état temporaire

### Option B : Migration Partielle (RECOMMANDÉE) ✅

**Principes** :
- Les props passées dynamiquement (`family`, `type`, `templatesNames`, `nextStep`) sont **locales** → **PAS de signal**
- Utiliser les signals pour **observer** l'outil actif et se fermer automatiquement
- Remplacer `window.addEventListener('tool-updated')` par `SignalWatcher`

**Changements** :
1. Ajouter `SignalWatcher`
2. Utiliser `activeTool` signal dans `firstUpdated()` pour observer les changements
3. Garder toutes les `@property` (elles sont appropriées pour ce cas d'usage)

## Implémentation Recommandée

### src/components/shape-selector.ts

```typescript
import { SignalWatcher } from '@lit-labs/signals';
import { activeTool } from '../store/appState';

@customElement('shape-selector')
export class ShapeSelector extends SignalWatcher(LitElement) {
  // Garder toutes les @property - elles sont appropriées ici
  @property({ type: String }) family;
  @property({ type: String }) type;
  @property({ type: Array }) templatesNames = [];
  @property({ type: Array }) titles = [];
  @property({ type: Object }) selectedTemplate;
  @property({ type: String }) nextStep;

  // Pas de render() différent - il est déjà optimal
  
  firstUpdated() {
    // Plus besoin de window.addEventListener
    // SignalWatcher observera automatiquement le signal activeTool
    this.checkAndClose();
  }
  
  updated() {
    // Cette méthode sera appelée automatiquement quand activeTool change
    this.checkAndClose();
  }
  
  private checkAndClose() {
    const currentToolName = activeTool.get();
    const actions = [
      'create',
      'createLine',
      'createPoint',
      'createTriangle',
      'createQuadrilateral',
      'createCircle',
    ];
    
    if (
      !actions.includes(currentToolName) ||
      !this.selectedTemplate ||
      this.selectedTemplate !== app.tool.selectedTemplate
    ) {
      this.remove();
    }
  }
}
```

## Alternative : Pas de Migration (AUSSI VALIDE)

**Argument** : Ce composant est :
- **Éphémère** (créé/détruit dynamiquement)
- **Local** (props spécifiques à chaque instance)
- **Déjà optimal** (code simple et direct)

La migration n'apporterait que **peu de valeur** :
- Suppression d'un seul listener `tool-updated`
- Ajout de complexité avec SignalWatcher
- Pas de simplification du code de création

**Recommandation finale** : **PAS DE MIGRATION** ou **migration minimale** (juste pour observer `activeTool`)

## Verdict

**Je recommande de SAUTER shape-selector** et de considérer la Phase 2 comme TERMINÉE avec succès.

**Raison** : Les composants critiques sont migrés. `shape-selector` est un composant éphémère avec état local approprié.
