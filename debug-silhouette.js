// Script de test pour déboguer le problème de silhouette
// À exécuter dans la console du navigateur après avoir ouvert l'interface Tangram

console.log('🧪 Test de débogage des silhouettes');

// Fonction pour vérifier l'état du tangramCanvasLayer
function checkTangramCanvasLayer() {
  console.log('📊 État du tangramCanvasLayer:');
  console.log('  - Existe:', !!app?.tangramCanvasLayer);

  if (app?.tangramCanvasLayer) {
    console.log('  - Nombre de shapes:', app.tangramCanvasLayer.shapes?.length || 0);
    console.log('  - Shapes:', app.tangramCanvasLayer.shapes);
  }

  console.log('📊 État du mainCanvasLayer:');
  if (app?.mainCanvasLayer) {
    console.log('  - Nombre de shapes:', app.mainCanvasLayer.shapes?.length || 0);
  }
}

// Vérifier avant chargement
console.log('\n🔍 AVANT chargement:');
checkTangramCanvasLayer();

// Écouter les événements
window.addEventListener('file-parsed', (event) => {
  console.log('\n📁 Événement file-parsed reçu:', event.detail);
  console.log('  - workspaceData.backObjects:', event.detail.workspaceData?.backObjects);
  console.log('  - wsdata.backObjects:', event.detail.wsdata?.backObjects);
});

window.addEventListener('tangram-canvas-ready', () => {
  console.log('\n🎯 Événement tangram-canvas-ready reçu');
  checkTangramCanvasLayer();
});

// Fonction de test à appeler après chargement d'un fichier .ags
function testAfterLoad() {
  console.log('\n🔍 APRÈS chargement:');
  checkTangramCanvasLayer();

  console.log('\n📋 Mode TangramManager:', document.querySelector('tangram-manager')?.mode);
  console.log('📋 SolutionCheckerTool présent:', !!document.querySelector('solution-checker-tool'));
}

console.log('\n✅ Script de débogage prêt!');
console.log('📝 Instructions:');
console.log('  1. Charger un fichier .ags');
console.log('  2. Regarder les logs dans la console');
console.log('  3. Appeler testAfterLoad() pour vérifier l\'état final');

// Exposer la fonction globalement
window.testAfterLoad = testAfterLoad;