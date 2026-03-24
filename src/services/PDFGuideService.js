/**
 * Service pour gérer l'ouverture du guide utilisateur en PDF
 * Permet de naviguer vers la bonne page selon l'environnement et l'outil
 */

/**
 * Pages issues de la table des matières de Mode_emploi.pdf
 * Les numéros sont 1-based (compatibles avec #page=)
 */
const GUIDE_PAGES = {
  default: 1,
  generalTools: 3,
  environments: {
    Grandeurs: {
      chapter: 7,
      tools: 14,
      mouvements: 9,
      operations: 10,
      figures: 8,
    },
    Cubes: {
      chapter: 17,
      tools: 18,
      mouvements: 18,
      operations: 18,
      figures: 17,
    },
    Tangram: {
      chapter: 21,
      tools: 26,
      mouvements: 25,
      operations: 23,
      figures: 24,
    },
    Geometrie: {
      chapter: 27,
      tools: 38,
      mouvements: 33,
      transformations: 34,
      operations: 35,
      construction: 28,
    },
  },
};

const GENERAL_TOOL_PAGES = {
  home: 2,
  save: 3,
  open: 3,
  settings: 3,
  undo: 3,
  redo: 3,
  replay: 3,
};

const TOOL_NAME_ALIASES = {
  createquadrilateral: 'createQuadrilateral',
  createregular: 'createRegular',
  createirregular: 'createIrregular',
  createpoint: 'createPoint',
  createline: 'createLine',
  createtriangle: 'createTriangle',
  createcircle: 'createCircle',
  orthogonalsymetry: 'orthogonalSymetry',
  centralsymetry: 'centralSymetry',
  tobackground: 'toBackground',
  resetposition: 'resetPosition',
  scalarmultiplication: 'scalarMultiplication',
};

/**
 * Classification des outils pour viser une section plus précise que la page
 * "Outils" quand c'est possible.
 */
const TOOL_SECTION_BY_NAME = {
  // Mouvements
  move: 'mouvements',
  rotate: 'mouvements',
  rotate45: 'mouvements',
  reverse: 'mouvements',
  translate: 'mouvements',

  // Transformations (surtout Géométrie)
  rotation: 'transformations',
  translation: 'transformations',
  centralSymetry: 'transformations',
  orthogonalSymetry: 'transformations',

  // Opérations
  divide: 'operations',
  cut: 'operations',
  copy: 'operations',
  duplicate: 'operations',
  merge: 'operations',
  transform: 'operations',
  buildCenter: 'operations',

  // Construction / figures
  create: 'construction',
  createPoint: 'construction',
  createLine: 'construction',
  createTriangle: 'construction',
  createCircle: 'construction',

  // Outils divers
  color: 'tools',
  delete: 'tools',
  hide: 'tools',
  show: 'tools',
  group: 'tools',
  ungroup: 'tools',
  zoom: 'tools',
  opacity: 'tools',
  toBackground: 'tools',
  resetPosition: 'tools',
  biface: 'tools',
};

/**
 * Mapping fin outil -> page, extrait du contenu du PDF (best effort).
 * Prioritaire sur le mapping par section.
 */
const TOOL_PAGE_BY_ENVIRONMENT = {
  Grandeurs: {
    create: 8,
    move: 9,
    rotate: 9,
    reverse: 9,
    divide: 10,
    cut: 11,
    buildCenter: 11,
    copy: 12,
    merge: 13,
    delete: 14,
    group: 14,
    ungroup: 14,
    toBackground: 14,
    color: 14,
    opacity: 15,
    biface: 15,
    translate: 15,
    zoom: 16,
    grid: 16,
  },
  Cubes: {
    create: 18,
    move: 18,
    rotate: 18,
    copy: 18,
    delete: 18,
    group: 19,
    ungroup: 19,
    toBackground: 19,
    color: 19,
    translate: 19,
    zoom: 20,
    grid: 20,
  },
  Tangram: {
    tangram: 21,
    move: 25,
    rotate: 25,
    reverse: 25,
    rotate45: 25,
    group: 26,
    ungroup: 26,
    resetPosition: 26,
    color: 26,
    translate: 26,
  },
  Geometrie: {
    createPoint: 28,
    createLine: 29,
    createTriangle: 30,
    createQuadrilateral: 31,
    createRegular: 31,
    createIrregular: 31,
    createCircle: 32,
    move: 33,
    rotate: 34,
    reverse: 34,
    orthogonalSymetry: 34,
    centralSymetry: 34,
    translation: 34,
    rotation: 34,
    transform: 35,
    scalarMultiplication: 35,
    divide: 36,
    cut: 37,
    buildCenter: 37,
    copy: 38,
    duplicate: 38,
    delete: 38,
    group: 39,
    ungroup: 39,
    toBackground: 39,
    color: 40,
    opacity: 40,
    hide: 40,
    show: 40,
    translate: 40,
    zoom: 41,
    grid: 41,
  },
};

function normalizeToolName(toolName) {
  const raw = (toolName || '').toString().trim();
  if (!raw) return '';

  const compact = raw.replace(/[\s_-]+/g, '');
  const lowerCompact = compact.toLowerCase();

  if (TOOL_NAME_ALIASES[lowerCompact]) {
    return TOOL_NAME_ALIASES[lowerCompact];
  }

  // Conserver la casse canonique lowerCamelCase attendue par les mappings
  return compact.charAt(0).toLowerCase() + compact.slice(1);
}

function resolveEnvironmentPage(environment, toolName) {
  const normalizedToolName = normalizeToolName(toolName);

  if (normalizedToolName && typeof GENERAL_TOOL_PAGES[normalizedToolName] === 'number') {
    return GENERAL_TOOL_PAGES[normalizedToolName];
  }

  const env = GUIDE_PAGES.environments[environment];
  if (!env) return toolName ? GUIDE_PAGES.generalTools : GUIDE_PAGES.default;

  // Sans outil actif: ouvrir le chapitre de l'environnement
  if (!toolName) return env.chapter;

  // Priorite au mapping fin outil -> page
  const envToolMap = TOOL_PAGE_BY_ENVIRONMENT[environment];
  if (envToolMap && typeof envToolMap[normalizedToolName] === 'number') {
    return envToolMap[normalizedToolName];
  }

  const section = TOOL_SECTION_BY_NAME[normalizedToolName];
  if (section && typeof env[section] === 'number') {
    return env[section];
  }

  // Avec outil actif mais sans correspondance précise: section "Outils"
  return env.tools || env.chapter;
}

/**
 * Ouvre le guide utilisateur PDF à la page appropriée
 * @param {string} environment - Nom de l'environnement (ex: 'Geometrie', 'Tangram')
 * @param {string} toolName - Nom de l'outil (ex: 'create', 'move')
 */
export function openPDFGuide(environment, toolName) {
  const pdfPath = '/data/Mode_emploi.pdf';
  const pageNumber = resolveEnvironmentPage(environment, toolName);

  // Ouvrir le PDF avec le paramètre page
  const url = `${pdfPath}#page=${pageNumber}`;
  window.open(url, 'pdf-guide', 'width=800,height=600');
}

/**
 * Obtient le numéro de page pour un environnement/outil spécifique
 * @param {string} environment - Nom de l'environnement
 * @param {string} toolName - Nom de l'outil
 * @returns {number} Le numéro de page (1 par défaut si non trouvé)
 */
export function getPageNumber(environment, toolName) {
  return resolveEnvironmentPage(environment, toolName);
}

/**
 * Met à jour le mapping des pages
 * Utile pour permettre la configuration dynamique
 * @param {object} newMapping - Nouveau mapping à fusionner avec l'existant
 */
export function updatePageMapping(newMapping) {
  if (!newMapping || typeof newMapping !== 'object') return;

  if (typeof newMapping.default === 'number') {
    GUIDE_PAGES.default = newMapping.default;
  }
  if (typeof newMapping.generalTools === 'number') {
    GUIDE_PAGES.generalTools = newMapping.generalTools;
  }

  if (newMapping.environments && typeof newMapping.environments === 'object') {
    Object.entries(newMapping.environments).forEach(([envName, envPages]) => {
      if (!GUIDE_PAGES.environments[envName]) {
        GUIDE_PAGES.environments[envName] = {};
      }
      Object.assign(GUIDE_PAGES.environments[envName], envPages);
    });
  }

  if (newMapping.toolSections && typeof newMapping.toolSections === 'object') {
    Object.assign(TOOL_SECTION_BY_NAME, newMapping.toolSections);
  }

  if (newMapping.toolPages && typeof newMapping.toolPages === 'object') {
    Object.entries(newMapping.toolPages).forEach(([envName, pages]) => {
      if (!TOOL_PAGE_BY_ENVIRONMENT[envName]) {
        TOOL_PAGE_BY_ENVIRONMENT[envName] = {};
      }
      Object.assign(TOOL_PAGE_BY_ENVIRONMENT[envName], pages);
    });
  }
}

/**
 * Obtient le mapping complet
 * @returns {object} Le mapping complet
 */
export function getPageMapping() {
  return {
    ...GUIDE_PAGES,
    generalToolPages: {
      ...GENERAL_TOOL_PAGES,
    },
    environments: {
      ...GUIDE_PAGES.environments,
    },
    toolSections: {
      ...TOOL_SECTION_BY_NAME,
    },
    toolPages: {
      ...TOOL_PAGE_BY_ENVIRONMENT,
    },
  };
}
