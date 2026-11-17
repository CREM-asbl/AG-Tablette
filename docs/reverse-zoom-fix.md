# Correction du bug d'animation du retournement d'un cercle avec zoom

## Problème identifié

Dans l'environnement Grandeurs, l'animation du retournement d'un cercle ne se comportait pas correctement lorsqu'un zoom avait été effectué. Les axes de symétrie et l'animation du retournement ne prenaient pas en compte le niveau de zoom actuel.

## Cause racine

Dans le fichier `ReverseTool.js`, la méthode `createAxis()` utilisait une longueur fixe (`this.axisLength = 200` pixels) pour créer les axes de symétrie sans ajustement selon le niveau de zoom.

Les coordonnées de l'axe étaient créées en ajoutant/soustrayant directement cette valeur aux coordonnées du centre :

```javascript
// AVANT (incorrect)
path = [
  'M',
  this.center.x,
  this.center.y - this.axisLength / 2,  // 200 pixels non ajustés
  'L',
  this.center.x,
  this.center.y + this.axisLength / 2,  // 200 pixels non ajustés
].join(' ');
```

### Pourquoi c'était un problème ?

- `this.center.x` et `this.center.y` sont en **coordonnées logiques** (coordonnées du monde, indépendantes du zoom)
- `this.axisLength` (200) était traité comme une valeur en coordonnées logiques, mais devait être ajusté selon le zoom pour maintenir une taille visuelle constante
- Avec un zoom de 2x, l'axe apparaissait 2x plus long visuellement, ce qui faussait les calculs de projection et l'animation du retournement

### Illustration

Avec zoom 1x :
- Longueur de l'axe en coordonnées logiques : 200
- Longueur visuelle à l'écran : 200 pixels ✅

Avec zoom 2x (AVANT la correction) :
- Longueur de l'axe en coordonnées logiques : 200
- Longueur visuelle à l'écran : 400 pixels ❌ (2x trop long)

## Solution implémentée

La longueur de l'axe est maintenant ajustée en fonction du niveau de zoom actuel pour maintenir une taille visuelle constante de 200 pixels à l'écran :

```javascript
// APRÈS (correct)
createAxis(orientation) {
  // Ajuster la longueur de l'axe selon le zoom pour maintenir une taille visuelle constante
  const axisLengthInLogicalCoords = this.axisLength / app.workspace.zoomLevel;

  let path = '';
  if (Math.abs(orientation - Math.PI / 2) < 0.01) {
    path = [
      'M',
      this.center.x,
      this.center.y - axisLengthInLogicalCoords / 2,
      'L',
      this.center.x,
      this.center.y + axisLengthInLogicalCoords / 2,
    ].join(' ');
  }
  // ... (même logique pour les autres orientations)
}
```

### Résultat

Avec zoom 1x :
- Longueur de l'axe en coordonnées logiques : 200 / 1 = 200
- Longueur visuelle à l'écran : 200 × 1 = 200 pixels ✅

Avec zoom 2x (APRÈS la correction) :
- Longueur de l'axe en coordonnées logiques : 200 / 2 = 100
- Longueur visuelle à l'écran : 100 × 2 = 200 pixels ✅

## Fichiers modifiés

- `src/controllers/Reverse/ReverseTool.js` : Correction de la méthode `createAxis()`

## Tests ajoutés

Un nouveau fichier de tests a été créé pour valider la correction :

- `test/controllers/Reverse/ReverseZoom.test.js`

Les tests vérifient :
1. ✅ Le calcul des coordonnées de retournement d'un cercle sans zoom
2. ✅ Le calcul des coordonnées de retournement d'un cercle avec zoom 2x
3. ✅ La création d'axes avec la bonne longueur visuelle quel que soit le zoom
4. ✅ Le calcul correct de la projection sur l'axe pour un point du cercle avec différents zooms (0.5x, 1x, 1.5x, 2x, 3x)

### Exécution des tests

```bash
# Tous les tests de ReverseTool
npm test -- test/controllers/Reverse/

# Tests spécifiques au zoom
npm test -- test/controllers/Reverse/ReverseZoom.test.js
```

## Impact

Cette correction résout le problème d'animation du retournement d'un cercle (et de toutes les formes) dans l'environnement Grandeurs lorsqu'un zoom a été effectué. Les axes de symétrie ont maintenant une taille visuelle constante quel que soit le niveau de zoom, et les calculs de projection pour l'animation fonctionnent correctement.

## Validation

- ✅ Tous les tests passent
- ✅ L'animation du retournement fonctionne correctement avec différents niveaux de zoom
- ✅ Les axes de symétrie ont une taille visuelle constante
- ✅ Les calculs de projection sont corrects en coordonnées logiques
- ✅ Aucune régression détectée

## Notes techniques

### Système de coordonnées

L'application utilise deux systèmes de coordonnées :

1. **Coordonnées logiques** : Coordonnées du monde, indépendantes du zoom et de la translation
2. **Coordonnées canvas** : Coordonnées à l'écran en pixels, obtenues par `coordLogiques × zoomLevel + translateOffset`

La conversion se fait via :
- `coordinates.toCanvasCoordinates()` : logiques → canvas
- `coordinates.fromCanvasCoordinates()` : canvas → logiques

### Principe de la correction

Pour maintenir une taille visuelle constante à l'écran :
- Une longueur en **pixels à l'écran** doit être divisée par le `zoomLevel` pour obtenir la longueur en **coordonnées logiques**
- Formule : `longueurLogique = longueurPixels / zoomLevel`
- Vérification : `longueurLogique × zoomLevel = longueurPixels` ✅
