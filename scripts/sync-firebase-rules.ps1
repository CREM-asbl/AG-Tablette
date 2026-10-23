# Script de récupération des règles Firebase depuis la console
# À utiliser pour synchroniser le repo avec les règles actuellement déployées

param(
  [switch]$Backup,
  [switch]$Compare,
  [string]$Output = "."
)

$PROJECT_ID = "apprenti-geometre"

Write-Host "`n🔄 Récupération des règles Firebase depuis la console" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

# Fonction pour récupérer les règles Firestore
function Get-FirestoreRules {
  Write-Host "📥 Récupération des règles Firestore..." -ForegroundColor Yellow

  try {
    # Utiliser gcloud pour récupérer les règles
    $rules = gcloud firestore databases describe "(default)" --project=$PROJECT_ID --format=json 2>&1

    if ($LASTEXITCODE -ne 0) {
      Write-Host "⚠️  gcloud non disponible. Utilisez la méthode manuelle :" -ForegroundColor Yellow
      Write-Host "   1. Ouvrir: https://console.firebase.google.com/project/$PROJECT_ID/firestore/rules" -ForegroundColor Gray
      Write-Host "   2. Copier les règles" -ForegroundColor Gray
      Write-Host "   3. Coller dans firestore.rules`n" -ForegroundColor Gray
      return $null
    }

    return $rules
  }
  catch {
    Write-Host "❌ Erreur lors de la récupération des règles Firestore" -ForegroundColor Red
    return $null
  }
}

# Fonction pour comparer les règles
function Compare-Rules {
  param([string]$LocalFile, [string]$RuleType)

  Write-Host "`n🔍 Comparaison des règles $RuleType..." -ForegroundColor Cyan

  if (!(Test-Path $LocalFile)) {
    Write-Host "❌ Fichier local $LocalFile introuvable" -ForegroundColor Red
    return
  }

  Write-Host "📂 Fichier local : $LocalFile" -ForegroundColor Gray
  Write-Host "🌐 Console Firebase : https://console.firebase.google.com/project/$PROJECT_ID" -ForegroundColor Gray

  Write-Host "`n⚠️  Vérification manuelle requise :" -ForegroundColor Yellow
  Write-Host "   Ouvrez la console et comparez visuellement les règles`n" -ForegroundColor Gray
}

# Fonction pour créer un backup
function Backup-Rules {
  $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $backupDir = "backups/firebase-rules/$timestamp"

  Write-Host "`n💾 Création d'un backup des règles locales..." -ForegroundColor Cyan

  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

  if (Test-Path "firestore.rules") {
    Copy-Item "firestore.rules" "$backupDir/firestore.rules"
    Write-Host "✅ firestore.rules → $backupDir/firestore.rules" -ForegroundColor Green
  }

  if (Test-Path "storage.rules") {
    Copy-Item "storage.rules" "$backupDir/storage.rules"
    Write-Host "✅ storage.rules → $backupDir/storage.rules" -ForegroundColor Green
  }

  Write-Host "`n📁 Backup créé dans : $backupDir`n" -ForegroundColor Green
}

# Menu principal
Write-Host "Mode d'utilisation :`n" -ForegroundColor White

if ($Backup) {
  Backup-Rules
}
elseif ($Compare) {
  Compare-Rules "firestore.rules" "Firestore"
  Compare-Rules "storage.rules" "Storage"
}
else {
  Write-Host "📖 OPTIONS DISPONIBLES :`n" -ForegroundColor Yellow

  Write-Host "1️⃣  Vérifier les différences (recommandé avant tout déploiement)" -ForegroundColor White
  Write-Host "   powershell scripts/sync-firebase-rules.ps1 -Compare`n" -ForegroundColor Gray

  Write-Host "2️⃣  Créer un backup des règles locales" -ForegroundColor White
  Write-Host "   powershell scripts/sync-firebase-rules.ps1 -Backup`n" -ForegroundColor Gray

  Write-Host "3️⃣  Récupérer les règles depuis Firebase (méthode manuelle)" -ForegroundColor White
  Write-Host "   a) Firestore : https://console.firebase.google.com/project/$PROJECT_ID/firestore/rules" -ForegroundColor Gray
  Write-Host "      → Copier → Coller dans firestore.rules" -ForegroundColor Gray
  Write-Host "   b) Storage  : https://console.firebase.google.com/project/$PROJECT_ID/storage/rules" -ForegroundColor Gray
  Write-Host "      → Copier → Coller dans storage.rules`n" -ForegroundColor Gray

  Write-Host "⚡ WORKFLOW RECOMMANDÉ :`n" -ForegroundColor Cyan

  Write-Host "Avant chaque déploiement :" -ForegroundColor White
  Write-Host "  1. powershell scripts/sync-firebase-rules.ps1 -Backup" -ForegroundColor Gray
  Write-Host "  2. Vérifier les règles dans Firebase Console" -ForegroundColor Gray
  Write-Host "  3. Si différences : décider quelle version garder" -ForegroundColor Gray
  Write-Host "  4. pnpm run deploy:rules`n" -ForegroundColor Gray

  Write-Host "Si quelqu'un a modifié les règles dans la console :" -ForegroundColor White
  Write-Host "  1. Copier les règles depuis la console" -ForegroundColor Gray
  Write-Host "  2. Créer une branche : git checkout -b fix/sync-firebase-rules" -ForegroundColor Gray
  Write-Host "  3. Coller dans firestore.rules / storage.rules" -ForegroundColor Gray
  Write-Host "  4. Commit : git commit -m 'fix: sync Firebase rules from console'" -ForegroundColor Gray
  Write-Host "  5. Push et créer une PR pour review`n" -ForegroundColor Gray

  Write-Host "📌 IMPORTANT : Ne jamais modifier directement dans la console après le versioning" -ForegroundColor Red
  Write-Host "   Toujours passer par Git pour traçabilité et review`n" -ForegroundColor Red
}
