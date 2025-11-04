/**
 * Utilitaires pour la migration entre versions de l'application
 */

/**
 * Compare deux versions (format "x.y.z" ou "x.y")
 * @param {string} version1
 * @param {string} version2
 * @returns {number} -1 si v1 < v2, 0 si égales, 1 si v1 > v2
 */
export function compareVersions(version1, version2) {
  // Nettoyer les versions en supprimant les suffixes comme "beta"
  const cleanVersion = (v) => v.split(' ')[0]; // Prend seulement la partie avant l'espace
  const parseVersion = (v) =>
    cleanVersion(v)
      .split('.')
      .map((n) => parseInt(n, 10));

  const v1Parts = parseVersion(version1);
  const v2Parts = parseVersion(version2);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    if (v1Part < v2Part) return -1;
    if (v1Part > v2Part) return 1;
  }
  return 0;
}

/**
 * Met à l'échelle une chaîne de path SVG
 * @param {string} pathString - Le path SVG à redimensionner
 * @param {number} scaleFactor - Le facteur d'échelle
 * @returns {string} Le path SVG redimensionné
 */
export function scalePathString(pathString, scaleFactor) {
  if (!pathString || typeof pathString !== 'string') return pathString;

  // Expression régulière pour trouver tous les nombres dans le path
  return pathString.replace(/-?\d+\.?\d*/g, (match) => {
    const number = parseFloat(match);
    return (number * scaleFactor).toString();
  });
}

/**
 * Applique une migration d'échelle aux données de workspace pour les anciennes versions
 * @param {Object} workspaceData - Les données du workspace à migrer
 * @param {number} scaleFactor - Le facteur d'échelle à appliquer
 */
export function migrateShapeScale(workspaceData, scaleFactor) {
  if (!workspaceData || !workspaceData.objects) return;

  console.log(
    `Migration d'échelle avec facteur ${scaleFactor} pour compatibilité avec les anciennes versions`,
  );

  // Mettre à jour les formes
  if (workspaceData.objects.shapesData) {
    workspaceData.objects.shapesData.forEach((shape) => {
      // Appliquer le scaling aux path SVG
      if (shape.path) {
        shape.path = scalePathString(shape.path, scaleFactor);
      }

      // Mettre à jour les coordonnées si présentes
      if (shape.coordinates) {
        shape.coordinates.x *= scaleFactor;
        shape.coordinates.y *= scaleFactor;
      }

      // Mettre à jour la taille si présente
      if (shape.size) {
        shape.size *= scaleFactor;
      }
    });
  }

  // Mettre à jour les points
  if (workspaceData.objects.pointsData) {
    workspaceData.objects.pointsData.forEach((point) => {
      if (point.coordinates) {
        point.coordinates.x *= scaleFactor;
        point.coordinates.y *= scaleFactor;
      }
    });
  }

  // Mettre à jour les segments
  if (workspaceData.objects.segmentsData) {
    workspaceData.objects.segmentsData.forEach((segment) => {
      if (segment.coordinates) {
        segment.coordinates.x *= scaleFactor;
        segment.coordinates.y *= scaleFactor;
      }

      // Mettre à jour les coordonnées des arcs si présentes
      if (segment.arcCenter) {
        segment.arcCenter.x *= scaleFactor;
        segment.arcCenter.y *= scaleFactor;
      }
    });
  }

  // Ajuster le zoom pour maintenir l'apparence visuelle
  if (workspaceData.zoomLevel) {
    workspaceData.zoomLevel /= scaleFactor;
  }

  // Ajuster l'offset pour maintenir la position
  if (workspaceData.offset) {
    workspaceData.offset.x *= scaleFactor;
    workspaceData.offset.y *= scaleFactor;
  }
}

/**
 * Vérifie si une sauvegarde nécessite une migration d'échelle
 * @param {Object} saveObject - L'objet de sauvegarde
 * @returns {boolean} True si une migration est nécessaire
 */
export function needsScaleMigration(saveObject) {
  if (!saveObject.appVersion) return false;

  // Migration nécessaire pour les versions <= 1.4.9
  const needsMigration = compareVersions(saveObject.appVersion, '1.4.9') <= 0;

  // Ne migrer que pour les environnements Grandeurs et Cubes
  const isTargetEnvironment =
    saveObject.envName === 'Grandeurs' || saveObject.envName === 'Cubes';

  return needsMigration && isTargetEnvironment;
}

/**
 * Applique toutes les migrations nécessaires à un objet de sauvegarde
 * @param {Object} saveObject - L'objet de sauvegarde à migrer
 */
export function applyMigrations(saveObject) {
  if (needsScaleMigration(saveObject)) {
    // Ratio de conversion : ancienne unité (50px/cm) vers nouvelle (37.8px/cm)
    const OLD_PIXELS_PER_CM = 50;
    const NEW_PIXELS_PER_CM = 37.8;
    const SCALE_FACTOR = NEW_PIXELS_PER_CM / OLD_PIXELS_PER_CM; // ≈ 0.756

    console.log(
      `Migration détectée pour ${saveObject.envName} v${saveObject.appVersion} - Application du facteur d'échelle ${SCALE_FACTOR}`,
    );

    migrateShapeScale(
      saveObject.workspaceData || saveObject.wsdata,
      SCALE_FACTOR,
    );
  }
}
