# 🔧 Scripts de maintenance Firebase Rules

Ce dossier contient les scripts PowerShell pour gérer la gouvernance des règles Firebase Security.

## 📜 Scripts disponibles

### 1. `check-firebase-rules.ps1` - Vérification initiale

**Usage** :
```powershell
.\scripts\check-firebase-rules.ps1
```

**Description** : Script de premier contact qui guide l'utilisateur pour vérifier les règles actuellement déployées dans Firebase Console.

**Quand l'utiliser** :
- ✅ Première fois que vous configurez le versioning des règles
- ✅ Avant le premier déploiement
- ✅ Pour obtenir les URLs de console rapides

---

### 2. `sync-firebase-rules.ps1` - Synchronisation et backup

**Usage** :
```powershell
# Créer un backup des règles locales
.\scripts\sync-firebase-rules.ps1 -Backup

# Comparer les règles locales avec Firebase
.\scripts\sync-firebase-rules.ps1 -Compare

# Afficher l'aide
.\scripts\sync-firebase-rules.ps1
```

**Description** : Script principal de maintenance qui permet de :
- Créer des backups timestampés des règles locales
- Comparer les règles locales avec celles de Firebase Console
- Récupérer les règles depuis Firebase (méthode manuelle guidée)

**Quand l'utiliser** :
- ✅ **AVANT CHAQUE DÉPLOIEMENT** (obligatoire)
- ✅ Après qu'une modification a été faite dans Firebase Console
- ✅ Pour créer un backup avant une modification importante
- ✅ En cas de doute sur la synchronisation

---

## 🔄 Workflow recommandé

### Scénario 1 : Déploiement normal (aucune modification console)

```powershell
# 1. Créer un backup de sécurité
.\scripts\sync-firebase-rules.ps1 -Backup

# 2. Vérifier qu'il n'y a pas de différences
.\scripts\sync-firebase-rules.ps1 -Compare

# 3. Déployer
npm run deploy:rules

# 4. Vérifier dans Firebase Console
```

### Scénario 2 : Quelqu'un a modifié les règles dans la console

```powershell
# 1. Créer un backup des règles locales (au cas où)
.\scripts\sync-firebase-rules.ps1 -Backup

# 2. Créer une branche de synchronisation
git checkout -b fix/sync-firebase-rules

# 3. Récupérer les règles depuis Firebase Console (manuel)
# Firestore : ouvrir https://console.firebase.google.com/project/apprenti-geometre/firestore/rules
# Copier TOUTES les règles → Coller dans firestore.rules

# Storage : ouvrir https://console.firebase.google.com/project/apprenti-geometre/storage/rules
# Copier TOUTES les règles → Coller dans storage.rules

# 4. Commit et push
git add firestore.rules storage.rules
git commit -m "fix: sync Firebase rules from console (modified on [DATE])"
git push origin fix/sync-firebase-rules

# 5. Créer une PR pour review

# 6. Après merge, les règles sont synchronisées
```

### Scénario 3 : Modification urgente en production

**En cas d'urgence de sécurité (rare) :**

1. **Modifier dans Firebase Console** pour correction immédiate
2. **Immédiatement après**, suivre le Scénario 2 pour synchroniser Git
3. **Documenter** l'incident dans un ticket/issue

**⚠️ Ce scénario doit rester exceptionnel !**

---

## 📁 Organisation des backups

Les backups sont créés dans :
```
backups/
└── firebase-rules/
    └── 20260224_153042/
        ├── firestore.rules
        └── storage.rules
```

Format du dossier : `YYYYMMDD_HHMMSS`

**Nettoyage** : Les backups peuvent être supprimés manuellement après quelques semaines. Garder au moins les 5 derniers.

---

## 🚨 Checklist de sécurité

Avant tout déploiement de règles, vérifier :

- [ ] Backup créé avec `-Backup`
- [ ] Comparaison faite avec `-Compare`
- [ ] Aucune différence non expliquée dans Firebase Console
- [ ] Tests locaux effectués (si possible avec émulateurs)
- [ ] Review par un collègue si modifications importantes
- [ ] Documentation mise à jour si changement de comportement

---

## 🛠️ Dépannage

### "Les règles de la console sont différentes de mes fichiers locaux"

**Cause** : Quelqu'un a modifié directement dans Firebase Console

**Solution** :
1. Déterminer quelle version est correcte (console ou locale)
2. Si console correcte : Suivre Scénario 2 (synchronisation)
3. Si locale correcte : Déployer avec `npm run deploy:rules`

### "Je ne sais pas quelle version garder"

**Solution** :
1. Créer un backup : `.\scripts\sync-firebase-rules.ps1 -Backup`
2. Copier les règles de la console dans des fichiers `.backup`
3. Comparer les deux versions ligne par ligne
4. Choisir la version la plus restrictive (sécurité > fonctionnalité)
5. Tester localement avec les émulateurs Firebase

### "J'ai déployé par erreur et écrasé des modifications console"

**Solution** :
1. Aller dans Firebase Console → Rules → History
2. Restaurer la version précédente
3. Copier les règles restaurées dans les fichiers locaux
4. Commit : `git commit -m "fix: restore Firebase rules from console history"`
5. Documenter l'incident

---

## 📚 Ressources

- **Documentation principale** : `docs/firebase-rules-governance.md`
- **Règles Firestore** : `firestore.rules`
- **Règles Storage** : `storage.rules`
- **Configuration** : `firebase.json`

---

## 🤝 Contribution

Si vous ajoutez un nouveau script :
1. Ajouter la documentation dans ce README
2. Commenter abondamment le code PowerShell
3. Ajouter des exemples d'usage
4. Mettre à jour `docs/firebase-rules-governance.md`

---

**Dernière mise à jour** : 24 février 2026
