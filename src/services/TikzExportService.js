/**
 * Service d'exportation TikZ pour les géométries créées dans AG-Tablette
 * Convertit les formes, points et segments du workspace en code TikZ
 * avec support complet des couleurs, largeurs, et styles
 */

/**
 * Convertit une couleur hexadécimale en valeurs RGB
 * @param {string} hexColor - Couleur au format '#rrggbb'
 * @returns {object} - {r, g, b} ou null si invalide
 */
const hexToRgb = (hexColor) => {
  if (!hexColor) return null;

  let hex = hexColor.toLowerCase().replace('#', '');

  // Expand #RGB to #RRGGBB
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  if (hex.length === 6 && /^[0-9a-f]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }

  return null;
};

/**
 * Convertit une couleur hexadécimale en format TikZ (hex ou RGB)
 * @param {string} hexColor - Couleur au format '#rrggbb'
 * @returns {string} - Couleur au format TikZ (nom standard ou custom)
 */
export const hexToTikzColor = (hexColor) => {
  if (!hexColor) return 'black';

  const colorMap = {
    '#000000': 'black',
    '#000': 'black',
    '#ffffff': 'white',
    '#fff': 'white',
    '#ff0000': 'red',
    '#f00': 'red',
    '#00ff00': 'green',
    '#0f0': 'green',
    '#0000ff': 'blue',
    '#00f': 'blue',
    '#ffff00': 'yellow',
    '#ff0': 'yellow',
    '#ff00ff': 'magenta',
    '#f0f': 'magenta',
    '#00ffff': 'cyan',
    '#0ff': 'cyan',
    '#ff8800': 'orange',
    '#ff0088': 'pink',
    '#800080': 'purple',
    '#800000': 'maroon',
    '#008000': 'darkgreen',
    '#008080': 'teal',
    '#ffa500': 'orange',
  };

  const lowerColor = hexColor.toLowerCase();
  if (colorMap[lowerColor]) {
    return colorMap[lowerColor];
  }

  // Pour les couleurs custom, on génère un nom unique basé sur le code hex
  let hex = lowerColor.replace('#', '');

  // Expand #RGB to #RRGGBB
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  if (hex.length === 6) {
    // Retourner un nom de couleur qui sera défini dans le preamble
    return `customColor${hex.toUpperCase()}`;
  }

  return 'black';
};

/**
 * Formate un nombre avec précision et supprime les zéros inutiles
 * @param {number} value - La valeur
 * @param {number} precision - Nombre de décimales
 * @returns {string} - La valeur formatée
 */
const formatNumber = (value, precision = 2) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  return Number(value).toFixed(precision).replace(/\.?0+$/, '');
};

/**
 * Normalise les coordonnées en préservant l'aspect ratio
 * Pour éviter que les carrés deviennent des rectangles
 * @param {number} value - La valeur à normaliser
 * @param {number} min - Valeur minimale de la plage source
 * @param {number} max - Valeur maximale de la plage source
 * @param {number} scale - Facteur d'échelle uniforme
 * @param {boolean} invert - Inverser pour l'axe Y
 * @returns {number} - Valeur normalisée
 */
const normalizeCoordinateWithAspectRatio = (value, min, max, scale, invert = false) => {
  if (!isFinite(min) || !isFinite(max) || min === max) {
    return 0;
  }

  // Normaliser dans la plage 0-1 puis multiplier par le scale uniforme
  let normalized = (value - min) * scale;

  // Inverser pour l'axe Y
  if (invert) {
    normalized = (max - min) * scale - normalized;
  }

  return Number(normalized.toFixed(2));
};

/**
 * Obtient un point par ID à partir de la couche du canvas
 * Cherche d'abord dans les points directs, puis dans les points des formes
 * @param {string} pointId - L'ID du point
 * @param {object} canvasLayer - La couche du canvas
 * @returns {object|null} - L'objet point ou null
 */
const getPointById = (pointId, canvasLayer) => {
  if (!canvasLayer) {
    return null;
  }

  // Chercher d'abord dans les points directs du canvas
  if (canvasLayer.points && Array.isArray(canvasLayer.points)) {
    const point = canvasLayer.points.find((p) => p && p.id === pointId);
    if (point) return point;
  }

  // Si non trouvé, chercher dans les points des formes
  if (canvasLayer.shapes && Array.isArray(canvasLayer.shapes)) {
    for (const shape of canvasLayer.shapes) {
      if (shape && shape.points && Array.isArray(shape.points)) {
        const point = shape.points.find((p) => p && p.id === pointId);
        if (point) return point;
      }
    }
  }

  return null;
};

/**
 * Génère les options TikZ pour une forme (couleur, largeur, remplissage)
 * @param {object} shape - L'objet shape
 * @returns {string} - Les options TikZ formatées
 */
const getShapeOptions = (shape) => {
  const options = [];

  if (!shape) return '';

  // Couleur du trait
  if (shape.strokeColor) {
    const tikzColor = hexToTikzColor(shape.strokeColor);
    options.push(`draw=${tikzColor}`);
  }

  // Largeur du trait pour la forme
  if (shape.strokeWidth) {
    const widthMap = {
      1: 'thin',
      2: 'thick',
      3: 'ultra thick',
    };
    const width = widthMap[shape.strokeWidth] || 'thick';
    options.push(width);
  }

  // Couleur de remplissage si présente et valide
  // Vérifier que ce n'est pas undefined, null, ou vide
  if (shape.fillColor && shape.fillColor.trim && shape.fillColor.trim() !== '' && shape.fillColor !== '#000' && shape.fillColor !== 'black') {
    const tikzColor = hexToTikzColor(shape.fillColor);
    options.push(`fill=${tikzColor}`);

    // Ajouter l'opacité si inférieure à 1
    if (shape.fillOpacity !== undefined && shape.fillOpacity < 1) {
      options.push(`fill opacity=${Number(shape.fillOpacity.toFixed(2))}`);
    }
  }

  return options.length > 0 ? `[${options.join(',')}]` : '';
};

/**
 * Génère les options TikZ pour un segment (couleur et largeur du segment)
 * Cascade depuis shape si le segment n'a pas ses propres props
 * @param {object} segment - L'objet segment
 * @param {object} shape - L'objet shape parent (pour fallback)
 * @returns {string} - Les options TikZ formatées
 */
const getSegmentOptions = (segment, shape) => {
  const options = [];

  if (!segment) return '';

  // Couleur du segment (override la couleur de la forme)
  if (segment.color) {
    const tikzColor = hexToTikzColor(segment.color);
    options.push(`draw=${tikzColor}`);
  } else if (shape && shape.strokeColor) {
    // Fallback à la couleur de la forme
    const tikzColor = hexToTikzColor(shape.strokeColor);
    options.push(`draw=${tikzColor}`);
  } else {
    options.push('draw=black');
  }

  // Largeur du segment (override la largeur de la forme)
  if (segment.width && segment.width !== 1) {
    const widthMap = {
      1: 'thin',
      2: 'thick',
      3: 'ultra thick',
    };
    const width = widthMap[segment.width];
    if (width) {
      options.push(width);
    } else {
      // Fallback: utiliser une valeur en points
      options.push(`line width=${segment.width * 1.5}pt`);
    }
  } else if (shape && shape.strokeWidth) {
    // Fallback à la largeur de la forme
    const widthMap = {
      1: 'thin',
      2: 'thick',
      3: 'ultra thick',
    };
    const width = widthMap[shape.strokeWidth];
    if (width) {
      options.push(width);
    }
  }

  return options.length > 0 ? `[${options.join(',')}]` : '[draw=black]';
};

/**
 * Génère le code TikZ pour un point (avec normalisation préservant l'aspect ratio)
 * @param {object} point - L'objet point
 * @param {object} bounds - Les limites {minX, maxX, minY, maxY, scale}
 * @returns {string} - Code TikZ du point
 */
const generatePointCode = (point, bounds) => {
  if (!point || !point.coordinates) {
    return '';
  }

  // Ignorer les points invisibles ou cachés
  if (point.visible === false) {
    return '';
  }

  // Normaliser les coordonnées avec aspect ratio préservé (Y est inversé pour TikZ)
  const x = normalizeCoordinateWithAspectRatio(point.coordinates.x, bounds.minX, bounds.maxX, bounds.scale, false);
  const y = normalizeCoordinateWithAspectRatio(point.coordinates.y, bounds.minY, bounds.maxY, bounds.scale, true);
  const options = [];

  // Couleur du point
  if (point.color) {
    const tikzColor = hexToTikzColor(point.color);
    options.push(`color=${tikzColor}`);
  } else {
    options.push('color=black');
  }

  // Taille du point
  const sizeMap = {
    1: '1.5pt',
    2: '2.5pt',
    3: '3.5pt',
  };
  const size = sizeMap[point.size] || '2.5pt';

  const optStr = `[${options.join(',')}]`;
  return `  \\filldraw${optStr} (${formatNumber(x)},${formatNumber(y)}) circle (${size});`;
};

/**
 * Génère le code TikZ pour un segment (avec normalisation préservant l'aspect ratio)
 * @param {object} segment - L'objet segment
 * @param {object} shape - L'objet shape parent
 * @param {object} canvasLayer - La couche du canvas
 * @param {object} bounds - Les limites {minX, maxX, minY, maxY, scale}
 * @returns {string} - Code TikZ du segment
 */
const generateSegmentCode = (segment, shape, canvasLayer, bounds) => {
  if (!segment || !segment.vertexIds || segment.vertexIds.length < 2) {
    return '';
  }

  // Convertir les IDs des sommets en coordonnées normalisées avec aspect ratio préservé (Y est inversé)
  const vertexPoints = segment.vertexIds
    .map((vertexId) => {
      const point = getPointById(vertexId, canvasLayer);
      if (point && point.coordinates) {
        const x = normalizeCoordinateWithAspectRatio(point.coordinates.x, bounds.minX, bounds.maxX, bounds.scale, false);
        const y = normalizeCoordinateWithAspectRatio(point.coordinates.y, bounds.minY, bounds.maxY, bounds.scale, true);
        return `(${formatNumber(x)},${formatNumber(y)})`;
      }
      return null;
    })
    .filter((p) => p !== null);

  if (vertexPoints.length < 2) {
    return '';
  }

  const points = vertexPoints.join(' -- ');
  const optStr = getSegmentOptions(segment, shape);

  return `  \\draw${optStr} ${points};`;
};

/**
 * Génère le code TikZ pour une forme (polygone, avec normalisation préservant l'aspect ratio)
 * @param {object} shape - L'objet shape
 * @param {object} _canvasLayer - La couche du canvas (non utilisée, gardée pour cohérence)
 * @param {object} bounds - Les limites {minX, maxX, minY, maxY, scale}
 * @returns {string} - Code TikZ de la forme
 */
const generateShapeCode = (shape, _canvasLayer, bounds) => {
  if (!shape) {
    return '';
  }

  // Vérifier si c'est un cercle (possède une méthode isCircle ou une propriété radius/arcCenterId)
  if (shape.isCircle && typeof shape.isCircle === 'function' && shape.isCircle()) {
    return generateCircleCode(shape, bounds);
  }

  // Compte sur shape.vertexes plutôt que shape.points
  const vertexArray = shape.vertexes || shape.points || [];
  if (vertexArray.length === 0) {
    return '';
  }

  const vertexPoints = vertexArray
    .map((point) => {
      if (point && point.coordinates) {
        const x = normalizeCoordinateWithAspectRatio(point.coordinates.x, bounds.minX, bounds.maxX, bounds.scale, false);
        const y = normalizeCoordinateWithAspectRatio(point.coordinates.y, bounds.minY, bounds.maxY, bounds.scale, true);
        return `(${formatNumber(x)},${formatNumber(y)})`;
      }
      return null;
    })
    .filter((p) => p !== null);

  if (vertexPoints.length < 2) {
    return '';
  }

  const pointCoords = vertexPoints.join(' -- ');
  const optStr = getShapeOptions(shape);

  // Pas de label pour TikZ (non utile)
  const code = `  \\draw${optStr} ${pointCoords} -- cycle;`;

  return code;
};

/**
 * Génère le code TikZ pour un cercle/disque
 * @param {object} shape - L'objet circle/disk shape
 * @param {object} bounds - Les limites {minX, maxX, minY, maxY, scale}
 * @returns {string} - Code TikZ du cercle
 */
const generateCircleCode = (shape, bounds) => {
  if (!shape) {
    return '';
  }

  // Pour les cercles, le centre est dans shape.segments[0].arcCenter
  // Le rayon est la distance entre le centre et le premier vertex
  const segments = shape.segments || [];
  if (segments.length === 0) {
    return '';
  }

  const arcCenter = segments[0].arcCenter;
  if (!arcCenter || !arcCenter.coordinates) {
    return '';
  }

  // Normaliser le centre
  const cx = normalizeCoordinateWithAspectRatio(arcCenter.coordinates.x, bounds.minX, bounds.maxX, bounds.scale, false);
  const cy = normalizeCoordinateWithAspectRatio(arcCenter.coordinates.y, bounds.minY, bounds.maxY, bounds.scale, true);

  // Calculer le rayon à partir du premier vertex
  let radius = 0.5; // Rayon par défaut

  const vertexArray = shape.vertexes || [];
  if (vertexArray.length > 0 && vertexArray[0] && vertexArray[0].coordinates) {
    // Rayon = distance entre le centre et le premier vertex
    const dx = vertexArray[0].coordinates.x - arcCenter.coordinates.x;
    const dy = vertexArray[0].coordinates.y - arcCenter.coordinates.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Normaliser la distance avec le même facteur d'échelle
    radius = distance * bounds.scale;
  }

  const optStr = getShapeOptions(shape);

  return `  \\draw${optStr} (${formatNumber(cx)},${formatNumber(cy)}) circle (${formatNumber(radius)});`;
};

/**
 * Collecte toutes les couleurs custom utilisées et génère les définitions TikZ
 * @param {object} canvasLayer - La couche du canvas
 * @returns {string} - Code LaTeX avec les \definecolor{} pour chaque couleur custom
 */
const generateColorDefinitions = (canvasLayer) => {
  const customColors = new Set();

  // Collecter les couleurs des formes
  if (canvasLayer.shapes && Array.isArray(canvasLayer.shapes)) {
    canvasLayer.shapes.forEach((shape) => {
      if (shape) {
        if (shape.strokeColor) {
          const colorName = hexToTikzColor(shape.strokeColor);
          if (colorName && colorName.startsWith('customColor')) {
            customColors.add(shape.strokeColor);
          }
        }
        if (shape.fillColor && shape.fillColor.trim && shape.fillColor.trim() !== '' && shape.fillColor !== '#000' && shape.fillColor !== 'black') {
          const colorName = hexToTikzColor(shape.fillColor);
          if (colorName && colorName.startsWith('customColor')) {
            customColors.add(shape.fillColor);
          }
        }
      }
    });
  }

  // Collecter les couleurs des segments
  if (canvasLayer.segments && Array.isArray(canvasLayer.segments)) {
    canvasLayer.segments.forEach((segment) => {
      if (segment && segment.color) {
        const colorName = hexToTikzColor(segment.color);
        if (colorName && colorName.startsWith('customColor')) {
          customColors.add(segment.color);
        }
      }
    });
  }

  // Collecter les couleurs des points
  if (canvasLayer.points && Array.isArray(canvasLayer.points)) {
    canvasLayer.points.forEach((point) => {
      if (point && point.color) {
        const colorName = hexToTikzColor(point.color);
        if (colorName && colorName.startsWith('customColor')) {
          customColors.add(point.color);
        }
      }
    });
  }

  // Génération des \definecolor{} pour chaque couleur custom
  let definitions = '';
  customColors.forEach((hexColor) => {
    const rgb = hexToRgb(hexColor);
    if (rgb) {
      const colorName = hexToTikzColor(hexColor);
      definitions += `\\definecolor{${colorName}}{RGB}{${rgb.r},${rgb.g},${rgb.b}}\n`;
    }
  });

  return definitions;
};

/**
 * Génère le code TikZ à partir d'une couche du canvas
 * Rend les formes, puis les segments, puis les points
 * @param {object} canvasLayer - La couche du canvas
 * @param {object} bounds - Les limites {minX, maxX, minY, maxY}
 * @returns {string} - Code TikZ généré
 */
const generateTikzFromCanvasLayer = (canvasLayer, bounds) => {
  if (!canvasLayer) {
    return '';
  }

  let tikzCode = '';

  // Génération du code pour les formes
  if (canvasLayer.shapes && Array.isArray(canvasLayer.shapes)) {
    tikzCode += '\n% Formes\n';
    canvasLayer.shapes.forEach((shape) => {
      if (shape) {
        const shapeCode = generateShapeCode(shape, canvasLayer, bounds);
        if (shapeCode) {
          tikzCode += shapeCode + '\n';
        }
      }
    });
  }

  // Génération du code pour les segments
  // Les segments peuvent appartenir à des formes et les override
  if (canvasLayer.segments && Array.isArray(canvasLayer.segments)) {
    tikzCode += '\n% Segments\n';
    canvasLayer.segments.forEach((segment) => {
      if (segment) {
        // Trouver la forme parent pour le fallback de style
        let parentShape = null;
        if (segment.shapeId && canvasLayer.shapes) {
          parentShape = canvasLayer.shapes.find((s) => s && s.id === segment.shapeId);
        }

        const segmentCode = generateSegmentCode(segment, parentShape, canvasLayer, bounds);
        if (segmentCode) {
          tikzCode += segmentCode + '\n';
        }
      }
    });
  }

  // Génération du code pour les points (y compris les sommets des formes)
  if (canvasLayer.points && Array.isArray(canvasLayer.points)) {
    tikzCode += '\n% Points (et sommets des figures)\n';
    canvasLayer.points.forEach((point) => {
      if (point) {
        // Afficher TOUS les points, y compris les sommets des formes
        const pointCode = generatePointCode(point, bounds);
        if (pointCode) {
          tikzCode += pointCode + '\n';
        }
      }
    });
  }

  return tikzCode;
};

/**
 * Génère un document TikZ complet avec environnement LaTeX
 * @param {object} app - L'instance de l'application
 * @returns {string} - Document TikZ complet
 */
export const generateTikzDocument = (app) => {
  if (!app || !app.mainCanvasLayer) {
    if (import.meta.env.DEV) {
      console.error(
        'TikzExportService: App ou mainCanvasLayer non disponible',
      );
    }
    return '';
  }

  const layer = app.mainCanvasLayer;

  // Estimer les limites du canvas en fonction de tous les points et formes
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  // Scan des points directs
  if (layer.points && Array.isArray(layer.points)) {
    layer.points.forEach((point) => {
      if (point && point.coordinates) {
        minX = Math.min(minX, point.coordinates.x);
        maxX = Math.max(maxX, point.coordinates.x);
        minY = Math.min(minY, point.coordinates.y);
        maxY = Math.max(maxY, point.coordinates.y);
      }
    });
  }

  // Scan des points de formes
  if (layer.shapes && Array.isArray(layer.shapes)) {
    layer.shapes.forEach((shape) => {
      if (shape) {
        const vertexArray = shape.vertexes || shape.points || [];
        vertexArray.forEach((point) => {
          if (point && point.coordinates) {
            minX = Math.min(minX, point.coordinates.x);
            maxX = Math.max(maxX, point.coordinates.x);
            minY = Math.min(minY, point.coordinates.y);
            maxY = Math.max(maxY, point.coordinates.y);
          }
        });
      }
    });
  }

  // Ajouter une marge
  const margin = 1;
  minX = isFinite(minX) ? minX - margin : -10;
  maxX = isFinite(maxX) ? maxX + margin : 10;
  minY = isFinite(minY) ? minY - margin : -10;
  maxY = isFinite(maxY) ? maxY + margin : 10;

  // Calculer les dimensions
  const width = maxX - minX;
  const height = maxY - minY;
  const maxDimension = Math.max(width, height);

  // Scale uniforme pour préserver l'aspect ratio
  const scale = maxDimension > 0 ? 100 / maxDimension : 1;

  // Créer l'objet bounds avec les limites et le scale uniforme
  const bounds = { minX, maxX, minY, maxY, scale };

  const tikzContent = generateTikzFromCanvasLayer(layer, bounds);
  const colorDefs = generateColorDefinitions(layer);

  const document = `% Généré par AG-Tablette - Exportation TikZ
% Document autonome pour LaTeX avec tikz
\\documentclass{standalone}
\\usepackage[x11names, dvipsnames, svgnames]{xcolor}
\\usepackage{tikz}

\\begin{document}

${colorDefs}
\\begin{tikzpicture}[scale=1]
${tikzContent}
\\end{tikzpicture}

\\end{document}`;

  return document;
};

/**
 * Crée un Blob contenant le code TikZ pour exportation
 * @param {object} app - L'instance de l'application
 * @returns {Blob} - Le contenu TikZ en tant que Blob
 */
export const createTikzBlob = (app) => {
  const tikzContent = generateTikzDocument(app);
  return new Blob([tikzContent], { type: 'text/x-tikz' });
};

export default {
  generateTikzDocument,
  createTikzBlob,
  hexToTikzColor,
};
