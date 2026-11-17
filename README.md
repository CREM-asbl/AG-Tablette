# AG-Tablette

Apprenti Géomètre - Application web éducative pour géométrie interactive sur tablettes.

## 🚀 Installation

```bash
pnpm install
```

## 💻 Développement

```bash
# Démarrer le serveur de développement
pnpm run dev

# Démarrer les émulateurs Firebase
pnpm run start-emulators
```

## 🏗️ Build & Déploiement

```bash
# Créer le build de production
pnpm run build

# Déployer sur Firebase
pnpm run deploy

# Déployer sur le canal beta
pnpm run deploy:beta3
```

### Déploiement CI (OIDC)

Le push sur `master` déclenche `deploy-production` : lint → tests unitaires → build → e2e → bump de version → déploiement Firebase Hosting.

Le workflow `CI/CD` peut aussi être lancé manuellement (onglet **Actions** → *CI/CD* → *Run workflow*) avec l'input `version_type` (`patch`, `minor` ou `major`) : le job `deploy-manual` exécute la même chaîne puis pousse le bump de version et le tag sur `master`. Le dispatch doit partir de la branche `master` : depuis une autre branche, `deploy-manual` échoue immédiatement (`Verify dispatch ref is master`) pour éviter de pousser un bump et un tag sur `master` avec le contenu de cette branche.

L'authentification utilise **Workload Identity Federation** (OIDC) : aucun token longue durée en secret GitHub. Le déploiement échoue maintenant si les secrets OIDC sont absents (plus de skip silencieux).

**Prérequis GCP (à faire une seule fois)**

```bash
PROJECT_ID=apprenti-geometre
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SA=github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com
POOL=github-actions
PROVIDER=github-actions

# 1. Service account
gcloud iam service-accounts create github-actions-deploy \
  --project=$PROJECT_ID \
  --display-name="GitHub Actions deploy"

# 2. Rôles nécessaires au déploiement Hosting
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/firebasehosting.admin"

# 3. Pool Workload Identity Federation + provider GitHub OIDC
gcloud iam workload-identity-pools create $POOL \
  --project=$PROJECT_ID \
  --location="global" \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc $PROVIDER \
  --project=$PROJECT_ID \
  --location="global" \
  --workload-identity-pool=$POOL \
  --display-name="GitHub Actions OIDC" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 4. Autoriser le repo à endosser la service account
gcloud iam service-accounts add-iam-policy-binding $SA \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/CREM-asbl/AG-Tablette"

# 5. Secrets GitHub (Settings → Secrets and variables → Actions)
#    GCP_WORKLOAD_IDENTITY_PROVIDER = projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}
#    GCP_SERVICE_ACCOUNT           = ${SA}
```

## 🧪 Tests

```bash
# Tests unitaires (Vitest)
pnpm test
pnpm run test:watch
pnpm run test:coverage

# Tests E2E (Playwright)
pnpm run test:playwright

# Tous les tests
pnpm run test:all
```

## 🔍 Qualité du code

```bash
# Linter
pnpm run lint
pnpm run lint:fix
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