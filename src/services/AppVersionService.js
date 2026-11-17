/**
 * Service pour gérer la version de l'application
 * Charge la version depuis le manifest généré à la compilation
 */

/**
 * Récupère le numéro de version depuis le manifest
 * @returns {Promise<string>} Le numéro de version (ex: "1.0.0")
 */
export async function loadAppVersion() {
  try {
    // Récupérer le manifest généré par @vite-pwa/astro
    const response = await fetch('/manifest.json');
    if (!response.ok) {
      console.warn('Manifest non trouvé, utilisation de la version par défaut');
      return '1.0.0';
    }

    const manifest = await response.json();
    const version = manifest.version || '1.0.0';

    console.log(`Version de l'application: ${version}`);
    return version;
  } catch (error) {
    console.warn('Erreur lors du chargement de la version du manifest:', error);
    return '1.0.0';
  }
}
