# Script de vérification et backup des règles Firebase actuelles
# À exécuter AVANT le premier déploiement des règles versionnées

Write-Host "`n🔍 Vérification des règles Firebase actuelles" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$PROJECT_ID = "apprenti-geometre"

Write-Host "📋 Étapes à suivre pour vérifier les règles actuelles :`n" -ForegroundColor Yellow

Write-Host "1️⃣  Firestore Rules" -ForegroundColor Green
Write-Host "   → Ouvrir: https://console.firebase.google.com/project/$PROJECT_ID/firestore/rules" -ForegroundColor Gray
Write-Host "   → Comparer avec: firestore.rules`n" -ForegroundColor Gray

Write-Host "2️⃣  Storage Rules" -ForegroundColor Green
Write-Host "   → Ouvrir: https://console.firebase.google.com/project/$PROJECT_ID/storage/rules" -ForegroundColor Gray
Write-Host "   → Comparer avec: storage.rules`n" -ForegroundColor Gray

Write-Host "3️⃣  Actions recommandées :`n" -ForegroundColor Yellow

Write-Host "   a) Si les règles actuelles sont IDENTIQUES aux fichiers locaux:" -ForegroundColor White
Write-Host "      → Tout est déjà synchronisé ✅" -ForegroundColor Green
Write-Host "      → Vous pouvez déployer: pnpm run deploy:rules`n" -ForegroundColor Green

Write-Host "   b) Si les règles actuelles sont DIFFÉRENTES:" -ForegroundColor White
Write-Host "      → Copier les règles actuelles depuis la console" -ForegroundColor Yellow
Write-Host "      → Créer un backup: " -ForegroundColor Yellow
Write-Host "        • firestore.rules.backup" -ForegroundColor Gray
Write-Host "        • storage.rules.backup" -ForegroundColor Gray
Write-Host "      → Décider quelle version garder (console ou locale)" -ForegroundColor Yellow
Write-Host "      → Ajuster les fichiers .rules si nécessaire" -ForegroundColor Yellow
Write-Host "      → Ensuite déployer: pnpm run deploy:rules`n" -ForegroundColor Yellow

Write-Host "   c) En cas de doute:" -ForegroundColor White
Write-Host "      → TOUJOURS faire un backup manuel depuis la console" -ForegroundColor Red
Write-Host "      → Firebase Console → Rules → History → Noter la version actuelle`n" -ForegroundColor Red

Write-Host "`n📂 Fichiers de règles locaux :" -ForegroundColor Cyan
Write-Host "   • firestore.rules" -ForegroundColor White
Write-Host "   • storage.rules" -ForegroundColor White
Write-Host "   • firebase.json (configuration)`n" -ForegroundColor White

Write-Host "📝 Documentation complète :" -ForegroundColor Cyan
Write-Host "   → docs/firebase-rules-governance.md`n" -ForegroundColor White

Write-Host "⚠️  RAPPEL IMPORTANT :" -ForegroundColor Red
Write-Host "   Ne jamais modifier les règles directement dans la console Firebase" -ForegroundColor Red
Write-Host "   après avoir commencé le versioning Git. Toujours passer par ce repo.`n" -ForegroundColor Red

Write-Host "🚀 Commandes de déploiement :" -ForegroundColor Cyan
Write-Host "   pnpm run deploy:rules               # Firestore + Storage" -ForegroundColor Gray
Write-Host "   pnpm run deploy:firestore-rules     # Firestore uniquement" -ForegroundColor Gray
Write-Host "   pnpm run deploy:storage-rules       # Storage uniquement`n" -ForegroundColor Gray

# Optionnel : ouvrir les URLs dans le navigateur
$response = Read-Host "Voulez-vous ouvrir les consoles Firebase dans le navigateur ? (O/N)"
if ($response -eq "O" -or $response -eq "o") {
  Write-Host "`n🌐 Ouverture des consoles...`n" -ForegroundColor Green
  Start-Process "https://console.firebase.google.com/project/$PROJECT_ID/firestore/rules"
  Start-Sleep -Seconds 1
  Start-Process "https://console.firebase.google.com/project/$PROJECT_ID/storage/rules"
  Write-Host "✅ Consoles ouvertes dans le navigateur`n" -ForegroundColor Green
}
else {
  Write-Host "`n✅ Script terminé. Vérifiez manuellement les règles dans Firebase Console.`n" -ForegroundColor Green
}
