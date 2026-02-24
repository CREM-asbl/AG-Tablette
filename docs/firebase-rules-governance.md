# 🔒 Gouvernance des règles Firebase Security

Ce document explique la gestion des règles de sécurité Firebase pour AG-Tablette.

## 📋 Vue d'ensemble

Les règles de sécurité Firebase sont maintenant versionnées dans ce repository :
- **Firestore** : `firestore.rules`
- **Storage** : `storage.rules`

## 🏗️ Architecture actuelle

### Collections Firestore

| Collection | Accès lecture | Accès écriture | Description |
|------------|---------------|----------------|-------------|
| `files` | 🌐 Public | 🔒 Admin seul | Documents d'activités (.agg) |
| `themes` | 🌐 Public | 🔒 Admin seul | Thèmes d'activités |
| `modules` | 🌐 Public | 🔒 Admin seul | Modules thématiques |
| `bugs` | 🔒 Admin seul | 🌐 Public (create) | Rapports de bugs utilisateurs |

### Firebase Storage

- **Lecture** : 🌐 Publique (tous les fichiers .agg/.agl/.tikz)
- **Écriture** : 🔒 Admin seul (upload via console ou scripts)

## � Problème de synchronisation multi-environnement

### ⚠️ Risque de désynchronisation

**Problème** : Si quelqu'un modifie les règles directement dans Firebase Console (autre projet, urgence, etc.), les fichiers locaux deviennent obsolètes et le prochain déploiement écrasera ces modifications.

**Solutions mises en place** :

### 1️⃣ Script de synchronisation automatique

Utiliser `sync-firebase-rules.ps1` avant chaque déploiement :

```powershell
# Créer un backup avant tout déploiement
powershell scripts/sync-firebase-rules.ps1 -Backup

# Comparer les règles locales avec Firebase Console
powershell scripts/sync-firebase-rules.ps1 -Compare
```

### 2️⃣ Workflow de récupération des modifications console

Si des règles ont été modifiées directement dans Firebase Console :

```powershell
# 1. Créer une branche de synchronisation
git checkout -b fix/sync-firebase-rules-from-console

# 2. Ouvrir Firebase Console
# Firestore : https://console.firebase.google.com/project/apprenti-geometre/firestore/rules
# Storage  : https://console.firebase.google.com/project/apprenti-geometre/storage/rules

# 3. Copier TOUTES les règles depuis la console

# 4. Remplacer le contenu de firestore.rules et/ou storage.rules

# 5. Commit avec message explicite
git add firestore.rules storage.rules
git commit -m "fix: sync Firebase rules from console (modified externally on 2026-02-24)"

# 6. Push et créer une PR pour review
git push origin fix/sync-firebase-rules-from-console

# 7. Après merge, les règles sont synchronisées
```

### 3️⃣ Checklist avant déploiement

**⚠️ TOUJOURS exécuter avant `npm run deploy:rules` :**

- [ ] Exécuter `powershell scripts/sync-firebase-rules.ps1 -Backup`
- [ ] Ouvrir Firebase Console et vérifier visuellement les règles
- [ ] Si différences détectées :
  - [ ] Récupérer les règles de la console
  - [ ] Créer une branche + commit + PR pour traçabilité
  - [ ] Faire valider les changements par l'équipe
- [ ] Sinon, déployer : `npm run deploy:rules`
- [ ] Vérifier dans Console que le déploiement a réussi

### 4️⃣ Politique stricte de gouvernance

**✅ OBLIGATOIRE :**
- Toute modification de règles DOIT passer par Git
- Toute modification urgente dans la console DOIT être suivie d'un commit de synchronisation
- Les règles de la console sont la **source de vérité** jusqu'à synchronisation Git

**❌ INTERDIT :**
- Modifier directement dans la console après avoir commencé le versioning (sauf urgence)
- Déployer sans vérifier les différences
- Écraser des modifications console sans les récupérer d'abord

### 5️⃣ Automatisation CI/CD (recommandé pour prod)

Pour éviter tout déploiement accidentel, ajouter un check dans GitHub Actions :

```yaml
# .github/workflows/firebase-rules-check.yml
name: Firebase Rules Check

on:
  pull_request:
    paths:
      - 'firestore.rules'
      - 'storage.rules'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Firestore Rules
        run: |
          # Ajouter validation syntaxe
          firebase deploy --only firestore:rules --dry-run
      - name: Validate Storage Rules
        run: |
          firebase deploy --only storage:rules --dry-run
```

## �🔍 Vérifier les règles actuelles dans Firebase Console

### Firestore Rules

1. Accéder à [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner le projet `apprenti-geometre`
3. Menu **Firestore Database** → onglet **Rules**
4. Comparer avec `firestore.rules` dans ce repo

### Storage Rules

1. Dans Firebase Console, menu **Storage**
2. Onglet **Rules**
3. Comparer avec `storage.rules` dans ce repo

### ⚠️ IMPORTANT : Première synchronisation

**Avant le premier déploiement :**

```powershell
# 1. Sauvegarder les règles actuelles depuis la console
# Copier manuellement depuis Firebase Console → Firestore/Storage → Rules
# et comparer avec firestore.rules et storage.rules de ce repo

# 2. Si différences significatives, ajuster les fichiers .rules
# pour correspondre à la production actuelle
```

## 🚀 Déployer les règles

### Déploiement complet (Firestore + Storage)

```powershell
firebase deploy --only firestore:rules,storage:rules
```

### Déploiement partiel

```powershell
# Firestore uniquement
firebase deploy --only firestore:rules

# Storage uniquement
firebase deploy --only storage:rules
```

### Workflow recommandé

1. **Modifier** les fichiers `firestore.rules` ou `storage.rules`
2. **Tester** localement (voir section Tests ci-dessous)
3. **Commit** les modifications dans Git
4. **Déployer** sur Firebase
5. **Vérifier** dans la console Firebase

## 🧪 Tester les règles localement

### Avec l'émulateur Firebase

```powershell
# Installer l'émulateur (si pas déjà fait)
firebase setup:emulators:firestore

# Démarrer l'émulateur
firebase emulators:start

# Dans un autre terminal, lancer l'app en mode dev
npm run dev
```

L'app utilisera automatiquement l'émulateur local au lieu de la production.

### Tests de sécurité manuels

Utilisez le [Firebase Rules Playground](https://firebase.google.com/docs/rules/simulator) dans la console pour simuler des opérations :

```javascript
// Exemple : Tester lecture fichier
collection: files
document: test-file-id
operation: get
authenticated: false
// Devrait réussir ✅

// Exemple : Tester écriture fichier
collection: files
document: test-file-id
operation: create/update
authenticated: false
// Devrait échouer ❌
```

## 📝 Modifications des règles

### Workflow Git

```powershell
# 1. Créer une branche
git checkout -b feat/update-firebase-rules

# 2. Modifier firestore.rules ou storage.rules
# ... éditer les fichiers ...

# 3. Tester localement
firebase emulators:start

# 4. Commit
git add firestore.rules storage.rules firebase.json
git commit -m "feat: update Firebase security rules - [description]"

# 5. Push et PR
git push origin feat/update-firebase-rules

# 6. Après merge, déployer
firebase deploy --only firestore:rules,storage:rules
```

### Principes de sécurité

✅ **À FAIRE :**
- Toujours restreindre au maximum (principe du moindre privilège)
- Valider les données en entrée (type, taille, champs requis)
- Documenter les changements dans ce fichier
- Tester avant de déployer

❌ **À ÉVITER :**
- `allow read, write: if true;` sur des collections sensibles
- Déploiement sans test local
- Modification directe dans la console (perte de versioning)

## 🔐 Règles actuelles expliquées

### Firestore (firestore.rules)

#### 📚 Collections publiques en lecture seule

**`files`, `themes`, `modules`** : Lecture publique, écriture admin uniquement
```javascript
allow read: if true;
allow create, update: if false;
allow delete: if false;
```
→ Tout le monde peut lire, seuls les admins Firebase peuvent écrire/modifier/supprimer

#### 🐛 Collection bugs : Création publique avec validation stricte

**Validation complète des rapports de bugs :**
```javascript
allow create: if
  // Structure obligatoire
  hasValidStructure(['message', 'timestamp'])

  // Message valide (10 à 10000 caractères)
  && isValidString(request.resource.data.message, 10, 10000)

  // Timestamp valide
  && isValidTimestamp(request.resource.data.timestamp)

  // Champs optionnels validés s'ils existent
  && (!('userAgent' in request.resource.data)
      || isValidString(request.resource.data.userAgent, 0, 500))

  && (!('url' in request.resource.data)
      || isValidString(request.resource.data.url, 0, 2000))

  && (!('stackTrace' in request.resource.data)
      || isValidString(request.resource.data.stackTrace, 0, 50000))

  && (!('severity' in request.resource.data)
      || request.resource.data.severity in ['error', 'warning', 'info'])

  // Limite de taille totale (1MB max)
  && request.resource.size() < 1000000;
```

**Protections :**
- ✅ Message minimum 10 caractères (évite spam vide)
- ✅ Message maximum 10KB (limite abus)
- ✅ UserAgent maximum 500 caractères
- ✅ URL maximum 2KB
- ✅ StackTrace maximum 50KB
- ✅ Severity enum strict : 'error' | 'warning' | 'info'
- ✅ Metadata limité à 100 entrées
- ✅ Document total maximum 1MB
- ✅ Aucune modification/suppression après création

#### 🔒 Collections système (préparées pour l'avenir)

**`analytics`, `settings`** : Complètement bloquées pour l'app
```javascript
allow read, write: if false;
```
→ Réservées au backend Firebase Functions ou admin console

#### 🛡️ Protection par défaut

```javascript
match /{document=**} {
  allow read, write: if false;
}
```
→ Toute collection non explicitement définie est **BLOQUÉE** par défaut (sécurité fail-safe)

### Storage (storage.rules)

#### 📁 Fichiers d'activités : Lecture publique universelle

**Règle générale :**
```javascript
match /{allPaths=**} {
  allow read: if true;
  allow write: if false;
}
```
→ Tous les fichiers sont lisibles publiquement, écriture admin uniquement

#### 📂 Règles spécifiques avec validation préparée

**Dossier `activities/` - fichiers .agg uniquement**
```javascript
match /activities/{fileName} {
  allow read: if true;
  allow write: if false;

  // Préparé pour activation ultérieure :
  // allow create, update: if isValidFileExtension(fileName, ['agg'])
  //                        && isValidFileSize(50); // Max 50MB
}
```

**Dossier `themes/` - assets thématiques**
```javascript
match /themes/{themeId}/{fileName} {
  allow read: if true;
  allow write: if false;

  // Préparé pour activation :
  // allow create, update: if isValidFileExtension(fileName, ['jpg', 'jpeg', 'png', 'svg', 'webp', 'json'])
  //                        && isValidFileSize(10); // Max 10MB
}
```

**Dossier `modules/` - assets des modules**
```javascript
match /modules/{moduleId}/{fileName} {
  allow read: if true;
  allow write: if false;

  // Préparé pour activation :
  // allow create, update: if isValidFileExtension(fileName, ['jpg', 'jpeg', 'png', 'svg', 'webp', 'json', 'agg', 'agl'])
  //                        && isValidFileSize(20); // Max 20MB
}
```

**Dossier `exports/` - exports utilisateurs (TikZ)**
```javascript
match /exports/{userId}/{fileName} {
  allow read: if true;
  allow write: if false;

  // Préparé pour activation avec authentification :
  // allow create: if isValidFileExtension(fileName, ['tikz', 'tex', 'pdf'])
  //                && isValidFileSize(5)
  //                && request.auth != null
  //                && request.auth.uid == userId;
  // allow delete: if request.auth != null && request.auth.uid == userId;
}
```

**Dossier `admin/` - Complètement protégé**
```javascript
match /admin/{allPaths=**} {
  allow read, write: if false;
}
```

#### 🛠️ Fonctions helper disponibles

```javascript
// Valider l'extension de fichier
function isValidFileExtension(filename, allowedExtensions) {
  return filename.matches('.*\\.(' + allowedExtensions.join('|') + ')$');
}

// Valider la taille de fichier
function isValidFileSize(maxSizeMB) {
  return request.resource.size < maxSizeMB * 1024 * 1024;
}
```

### 🎯 Avantages de ces règles précises

1. **Sécurité renforcée** : Validation stricte des données en entrée
2. **Protection contre abus** : Limites de taille et format
3. **Évolutivité** : Règles commentées prêtes à activer
4. **Traçabilité** : Chaque règle est documentée et justifiée
5. **Fail-safe** : Tout ce qui n'est pas explicitement autorisé est bloqué

## 🛠️ Commandes utiles

```powershell
# Lister les projets Firebase
firebase projects:list

# Vérifier le projet actuel
firebase use

# Changer de projet
firebase use apprenti-geometre

# Voir toutes les règles déployées
firebase firestore:indexes  # Indexes Firestore
firebase firestore:rules    # (pas de commande directe, voir console)

# Logs de déploiement
firebase deploy --only firestore:rules,storage:rules --debug
```

## 📚 Ressources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Documentation](https://firebase.google.com/docs/storage/security)
- [Rules Reference](https://firebase.google.com/docs/rules/rules-language)
- [Testing Rules](https://firebase.google.com/docs/rules/unit-tests)

## 🚨 En cas d'urgence

Si les règles déployées causent un problème de production :

1. **Rollback immédiat dans Firebase Console** :
   - Aller dans Rules → History
   - Restaurer la version précédente

2. **Corriger localement** :
   - Identifier le problème dans les fichiers .rules
   - Tester avec l'émulateur
   - Redéployer la correction

3. **Notification** :
   - Documenter l'incident dans un ticket/issue
   - Mettre à jour ce document si nécessaire

---

**Dernière mise à jour** : 24 février 2026
**Projet** : apprenti-geometre (AG-Tablette)
**Propriétaire** : CREM-asbl
